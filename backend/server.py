from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, UploadFile, File, Form, Header, Query
from fastapi.responses import Response as FastResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

# --- Config ---
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
APP_NAME = os.environ.get("APP_NAME", "dersim")

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Storage ---
STORAGE_BASE = (os.environ.get("INTEGRATION_PROXY_URL") or "").strip() or "https://integrations.emergentagent.com"
STORAGE_URL = STORAGE_BASE.rstrip("/") + "/objstore/api/v1/storage"
EMERGENT_KEY = os.environ.get("EMERGENT_LLM_KEY")
storage_key = None

def init_storage(force: bool = False):
    global storage_key
    if storage_key and not force:
        return storage_key
    resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": EMERGENT_KEY}, timeout=30)
    resp.raise_for_status()
    storage_key = resp.json()["storage_key"]
    return storage_key

def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data, timeout=120,
    )
    if resp.status_code in (403, 404):
        key = init_storage(force=True)
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data, timeout=120,
        )
    resp.raise_for_status()
    return resp.json()

def get_object(path: str):
    key = init_storage()
    resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    if resp.status_code in (403, 404):
        key = init_storage(force=True)
        resp = requests.get(f"{STORAGE_URL}/objects/{path}", headers={"X-Storage-Key": key}, timeout=60)
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")

# --- Auth helpers ---
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(hours=12), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=43200, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Oturum bulunamadı")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Geçersiz token")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Kullanıcı bulunamadı")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Oturum süresi doldu")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

# --- Schemas ---
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class CourseIn(BaseModel):
    name: str = Field(min_length=1)
    color: Optional[str] = "#FFE37E"
    notes: Optional[str] = ""

class CourseUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    notes: Optional[str] = None
    completed: Optional[bool] = None

class LinkIn(BaseModel):
    title: str
    url: str
    description: Optional[str] = ""

class LinkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None

class ReorderIn(BaseModel):
    ordered_ids: List[str]

# --- Helpers ---
def course_out(doc):
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", ""),
        "color": doc.get("color", "#FFE37E"),
        "notes": doc.get("notes", ""),
        "position": doc.get("position", 0),
        "completed": bool(doc.get("completed", False)),
        "created_at": doc.get("created_at"),
        "updated_at": doc.get("updated_at"),
    }

def link_out(doc):
    return {
        "id": str(doc["_id"]),
        "course_id": str(doc.get("course_id")),
        "title": doc.get("title", ""),
        "url": doc.get("url", ""),
        "description": doc.get("description", ""),
        "created_at": doc.get("created_at"),
    }

def pdf_out(doc):
    return {
        "id": str(doc["_id"]),
        "course_id": str(doc.get("course_id")),
        "filename": doc.get("filename", ""),
        "size": doc.get("size", 0),
        "storage_path": doc.get("storage_path", ""),
        "created_at": doc.get("created_at"),
    }

# --- Auth endpoints ---
@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    doc = {
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name,
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": payload.name, "role": "user"}

@api_router.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    uid = str(user["_id"])
    access = create_access_token(uid, email)
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)
    return {"id": uid, "email": email, "name": user.get("name", ""), "role": user.get("role", "user")}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}

@api_router.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6)

@api_router.patch("/auth/me")
async def update_profile(payload: ProfileUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None and v != ""}
    if not update:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
    await db.users.update_one({"_id": ObjectId(user["id"])}, {"$set": update})
    user.update(update)
    return user

@api_router.post("/auth/change-password")
async def change_password(payload: ChangePasswordIn, user=Depends(get_current_user)):
    doc = await db.users.find_one({"_id": ObjectId(user["id"])})
    if not doc or not verify_password(payload.current_password, doc["password_hash"]):
        raise HTTPException(status_code=400, detail="Mevcut şifre hatalı")
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    return {"ok": True}

# --- Admin ---
async def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Yönetici yetkisi gerekli")
    return user

@api_router.get("/admin/users")
async def admin_list_users(_: dict = Depends(require_admin)):
    users = []
    async for u in db.users.find({}).sort("created_at", -1):
        uid = str(u["_id"])
        courses_count = await db.courses.count_documents({"user_id": uid})
        pdfs_count = await db.pdfs.count_documents({"user_id": uid, "is_deleted": {"$ne": True}})
        links_count = await db.links.count_documents({"user_id": uid})
        users.append({
            "id": uid,
            "email": u.get("email"),
            "name": u.get("name", ""),
            "role": u.get("role", "user"),
            "created_at": u.get("created_at"),
            "courses_count": courses_count,
            "pdfs_count": pdfs_count,
            "links_count": links_count,
        })
    return {
        "total": len(users),
        "users": users,
    }

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, admin=Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="Kendini silemezsin")
    res = await db.users.delete_one({"_id": ObjectId(user_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    await db.courses.delete_many({"user_id": user_id})
    await db.links.delete_many({"user_id": user_id})
    await db.pdfs.delete_many({"user_id": user_id})
    return {"ok": True}

# --- Courses ---
@api_router.get("/courses")
async def list_courses(user=Depends(get_current_user)):
    cursor = db.courses.find({"user_id": user["id"]}).sort("position", 1)
    return [course_out(d) async for d in cursor]

@api_router.post("/courses")
async def create_course(payload: CourseIn, user=Depends(get_current_user)):
    count = await db.courses.count_documents({"user_id": user["id"]})
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "user_id": user["id"],
        "name": payload.name,
        "color": payload.color or "#FFE37E",
        "notes": payload.notes or "",
        "position": count,
        "created_at": now,
        "updated_at": now,
    }
    result = await db.courses.insert_one(doc)
    doc["_id"] = result.inserted_id
    return course_out(doc)

@api_router.patch("/courses/{course_id}")
async def update_course(course_id: str, payload: CourseUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.courses.find_one_and_update(
        {"_id": ObjectId(course_id), "user_id": user["id"]},
        {"$set": update},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    return course_out(result)

@api_router.delete("/courses/{course_id}")
async def delete_course(course_id: str, user=Depends(get_current_user)):
    res = await db.courses.delete_one({"_id": ObjectId(course_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    await db.links.delete_many({"course_id": course_id, "user_id": user["id"]})
    await db.pdfs.delete_many({"course_id": course_id, "user_id": user["id"]})
    return {"ok": True}

@api_router.post("/courses/reorder")
async def reorder_courses(payload: ReorderIn, user=Depends(get_current_user)):
    for idx, cid in enumerate(payload.ordered_ids):
        await db.courses.update_one(
            {"_id": ObjectId(cid), "user_id": user["id"]},
            {"$set": {"position": idx, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
    return {"ok": True}

# --- Links ---
@api_router.get("/courses/{course_id}/links")
async def list_links(course_id: str, user=Depends(get_current_user)):
    cursor = db.links.find({"course_id": course_id, "user_id": user["id"]}).sort("created_at", -1)
    return [link_out(d) async for d in cursor]

@api_router.post("/courses/{course_id}/links")
async def create_link(course_id: str, payload: LinkIn, user=Depends(get_current_user)):
    course = await db.courses.find_one({"_id": ObjectId(course_id), "user_id": user["id"]})
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    doc = {
        "user_id": user["id"],
        "course_id": course_id,
        "title": payload.title,
        "url": payload.url,
        "description": payload.description or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.links.insert_one(doc)
    doc["_id"] = result.inserted_id
    return link_out(doc)

@api_router.patch("/links/{link_id}")
async def update_link(link_id: str, payload: LinkUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="Güncellenecek alan yok")
    result = await db.links.find_one_and_update(
        {"_id": ObjectId(link_id), "user_id": user["id"]},
        {"$set": update},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    return link_out(result)

@api_router.delete("/links/{link_id}")
async def delete_link(link_id: str, user=Depends(get_current_user)):
    res = await db.links.delete_one({"_id": ObjectId(link_id), "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Link bulunamadı")
    return {"ok": True}

# --- PDFs ---
@api_router.get("/courses/{course_id}/pdfs")
async def list_pdfs(course_id: str, user=Depends(get_current_user)):
    cursor = db.pdfs.find({"course_id": course_id, "user_id": user["id"], "is_deleted": {"$ne": True}}).sort("created_at", -1)
    return [pdf_out(d) async for d in cursor]

@api_router.post("/courses/{course_id}/pdfs")
async def upload_pdf(course_id: str, file: UploadFile = File(...), user=Depends(get_current_user)):
    course = await db.courses.find_one({"_id": ObjectId(course_id), "user_id": user["id"]})
    if not course:
        raise HTTPException(status_code=404, detail="Ders bulunamadı")
    if not (file.content_type == "application/pdf" or (file.filename or "").lower().endswith(".pdf")):
        raise HTTPException(status_code=400, detail="Sadece PDF dosyaları kabul edilir")
    data = await file.read()
    if len(data) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Dosya 25MB'dan büyük olamaz")
    ext = "pdf"
    path = f"{APP_NAME}/uploads/{user['id']}/{uuid.uuid4()}.{ext}"
    try:
        result = put_object(path, data, "application/pdf")
    except Exception as e:
        logger.error(f"Storage upload failed: {e}")
        raise HTTPException(status_code=500, detail="Dosya yüklenemedi")
    doc = {
        "user_id": user["id"],
        "course_id": course_id,
        "filename": file.filename or "document.pdf",
        "storage_path": result["path"],
        "size": result.get("size", len(data)),
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    ins = await db.pdfs.insert_one(doc)
    doc["_id"] = ins.inserted_id
    return pdf_out(doc)

@api_router.get("/pdfs/{pdf_id}/download")
async def download_pdf(pdf_id: str, request: Request, auth: Optional[str] = Query(None)):
    # accept cookie or ?auth= token for iframe/img usage
    if auth and not request.cookies.get("access_token"):
        request.cookies.__dict__.setdefault("_dict", {})
    user = None
    token = request.cookies.get("access_token") or auth
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    record = await db.pdfs.find_one({"_id": ObjectId(pdf_id), "user_id": user_id, "is_deleted": {"$ne": True}})
    if not record:
        raise HTTPException(status_code=404, detail="PDF bulunamadı")
    try:
        data, ctype = get_object(record["storage_path"])
    except Exception as e:
        logger.error(f"Storage download failed: {e}")
        raise HTTPException(status_code=500, detail="Dosya alınamadı")
    return FastResponse(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{record.get("filename","file.pdf")}"'},
    )

@api_router.delete("/pdfs/{pdf_id}")
async def delete_pdf(pdf_id: str, user=Depends(get_current_user)):
    res = await db.pdfs.update_one(
        {"_id": ObjectId(pdf_id), "user_id": user["id"]},
        {"$set": {"is_deleted": True}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="PDF bulunamadı")
    return {"ok": True}

# --- Root ---
@api_router.get("/")
async def root():
    return {"message": "Dersim API"}

app.include_router(api_router)

@app.get("/health")
async def health():
    return {"status": "ok"}

def _parse_origins():
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if raw and raw != "*":
        return [o.strip() for o in raw.split(",") if o.strip()]
    fu = os.environ.get("FRONTEND_URL", "").strip()
    return [fu] if fu else ["*"]

_cors_origins = _parse_origins()
_allow_credentials = _cors_origins != ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=_allow_credentials,
    allow_origins=_cors_origins,
    allow_origin_regex=os.environ.get("CORS_ORIGIN_REGEX") or None,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.courses.create_index([("user_id", 1), ("position", 1)])
    await db.links.create_index([("user_id", 1), ("course_id", 1)])
    await db.pdfs.create_index([("user_id", 1), ("course_id", 1)])
    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@dersim.app").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "Admin123!")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Admin seeded: {admin_email}")
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info(f"Admin password updated: {admin_email}")
    try:
        init_storage()
        logger.info("Storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
