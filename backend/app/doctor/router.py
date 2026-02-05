from fastapi import APIRouter
from app.doctor.routers import auth, users, places, documents, owner_requests

router = APIRouter()

router.include_router(auth.router, prefix="/auth")
router.include_router(users.router, prefix="/users")
router.include_router(places.router, prefix="/places")
router.include_router(documents.router, prefix="/documents")
router.include_router(owner_requests.router, prefix="/owner")
