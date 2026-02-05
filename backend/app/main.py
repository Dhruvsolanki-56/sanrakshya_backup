from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from app.apis import auth, users
from app.apis import children
from app.apis import vaccines
from app.apis import milestones
from app.apis import illness
from app.apis import foods
from app.apis import food_logs
from app.apis import measurements
from app.apis import predictions
from app.apis import child_profile
from app.apis import nutrition
from app.apis import chatbot
from app.apis import reports
from app.doctor import router as doctor_router
import re

app = FastAPI(title="Sanrakshya API")

@app.exception_handler(IntegrityError)
async def integrity_error_exception_handler(request: Request, exc: IntegrityError):
    error_field = "unknown"
    
    if exc.orig and hasattr(exc.orig, 'diag'):
        detail = exc.orig.diag.message_detail
        match = re.search(r"Key \((?P<key>.+)\)=\((?P<value>.+)\) already exists", detail)
        if match:
            data = match.groupdict()
            error_field = data['key']

    return JSONResponse(
        status_code=409,
        content={
            "detail": [
                {
                    "loc": ["body", error_field],
                    "msg": f"A user with this {error_field} already exists.",
                    "type": "value_error.unique"
                }
            ]
        },
    )

app.add_middleware(
    CORSMiddleware,
    # allow_origins=["https://your-frontend-domain.com", "http://localhost:8081"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(doctor_router.router, prefix="/doctor", tags=["doctor"])
app.include_router(children.router, prefix="/children", tags=["children"])
app.include_router(vaccines.router, prefix="/vaccines", tags=["vaccines"])
app.include_router(milestones.router, prefix="/milestones", tags=["milestones"])
app.include_router(illness.router, prefix="/illness", tags=["illness"])
app.include_router(foods.router, prefix="/foods", tags=["foods"])
app.include_router(food_logs.router, prefix="/food-logs", tags=["food-logs"])
app.include_router(measurements.router, prefix="/measurements", tags=["measurements"])
app.include_router(predictions.router, prefix="/predictions", tags=["predictions"])
app.include_router(nutrition.router, prefix="/nutrition", tags=["nutrition"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])
app.include_router(reports.router, prefix="/reports", tags=["reports"])
app.include_router(child_profile.router, prefix="/children", tags=["children"])

@app.get("/")
async def health():
    return {"status": "ok"}
