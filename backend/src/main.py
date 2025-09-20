from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from src.logic.config_manager import initialize_config_file
from src.v1 import routes as v1


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup
    initialize_config_file()
    print("Application started")
    yield
    # Shutdown
    print("Application shutting down")


app = FastAPI(title="Learn with GenAI API", version="1.0.0", lifespan=lifespan)

origins = ["http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(v1.router)
app.include_router(api_router)


@app.get("/")
async def root():
    return RedirectResponse(url="/docs")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
