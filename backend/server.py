from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from enum import Enum
import qrcode
import io
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

class AccountStatus(str, Enum):
    INIT = "INIT"
    QR = "QR"
    AUTH = "AUTH"
    READY = "READY"
    DISCONNECTED = "DISCONNECTED"

class WhatsAppAccount(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone_number: Optional[str] = None
    status: AccountStatus = AccountStatus.INIT
    webhook_url: Optional[str] = None
    qr_code: Optional[str] = None
    last_snapshot: Optional[str] = None
    snapshot_timestamp: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_seen: Optional[datetime] = None

class AccountCreate(BaseModel):
    name: str
    webhook_url: Optional[str] = None

class AccountUpdate(BaseModel):
    webhook_url: str

def generate_qr_code(data: str) -> str:
    """Generate QR code and return as base64 encoded image"""
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"

def generate_mock_snapshot() -> str:
    """Generate a mock snapshot (placeholder for real WhatsApp screenshot)"""
    return "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzI1RDM2NiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5XaGF0c0FwcCBTbmFwc2hvdDwvdGV4dD48L3N2Zz4="

@api_router.get("/")
async def root():
    return {"message": "WhatsApp Monitoring API"}

@api_router.post("/accounts", response_model=WhatsAppAccount)
async def create_account(input: AccountCreate):
    """Create a new WhatsApp account to monitor"""
    account_dict = input.model_dump()
    account = WhatsAppAccount(**account_dict)
    
    account.status = AccountStatus.QR
    qr_data = f"whatsapp-monitor-{account.id}"
    account.qr_code = generate_qr_code(qr_data)
    
    doc = account.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    if doc.get('last_seen'):
        doc['last_seen'] = doc['last_seen'].isoformat()
    if doc.get('snapshot_timestamp'):
        doc['snapshot_timestamp'] = doc['snapshot_timestamp'].isoformat()
    
    await db.whatsapp_accounts.insert_one(doc)
    return account

@api_router.get("/accounts", response_model=List[WhatsAppAccount])
async def get_accounts():
    """Get all WhatsApp accounts"""
    accounts = await db.whatsapp_accounts.find({}, {"_id": 0}).to_list(1000)
    
    for account in accounts:
        if isinstance(account.get('created_at'), str):
            account['created_at'] = datetime.fromisoformat(account['created_at'])
        if isinstance(account.get('last_seen'), str):
            account['last_seen'] = datetime.fromisoformat(account['last_seen'])
        if isinstance(account.get('snapshot_timestamp'), str):
            account['snapshot_timestamp'] = datetime.fromisoformat(account['snapshot_timestamp'])
    
    return accounts

@api_router.get("/accounts/{account_id}", response_model=WhatsAppAccount)
async def get_account(account_id: str):
    """Get a specific WhatsApp account"""
    account = await db.whatsapp_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if isinstance(account.get('created_at'), str):
        account['created_at'] = datetime.fromisoformat(account['created_at'])
    if isinstance(account.get('last_seen'), str):
        account['last_seen'] = datetime.fromisoformat(account['last_seen'])
    if isinstance(account.get('snapshot_timestamp'), str):
        account['snapshot_timestamp'] = datetime.fromisoformat(account['snapshot_timestamp'])
    
    return account

@api_router.put("/accounts/{account_id}/webhook", response_model=WhatsAppAccount)
async def update_webhook(account_id: str, update: AccountUpdate):
    """Update webhook URL for an account"""
    result = await db.whatsapp_accounts.update_one(
        {"id": account_id},
        {"$set": {"webhook_url": update.webhook_url}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    account = await db.whatsapp_accounts.find_one({"id": account_id}, {"_id": 0})
    
    if isinstance(account.get('created_at'), str):
        account['created_at'] = datetime.fromisoformat(account['created_at'])
    if isinstance(account.get('last_seen'), str):
        account['last_seen'] = datetime.fromisoformat(account['last_seen'])
    if isinstance(account.get('snapshot_timestamp'), str):
        account['snapshot_timestamp'] = datetime.fromisoformat(account['snapshot_timestamp'])
    
    return account

@api_router.post("/accounts/{account_id}/connect")
async def simulate_connect(account_id: str):
    """Simulate account connection (mock for demo)"""
    result = await db.whatsapp_accounts.update_one(
        {"id": account_id},
        {
            "$set": {
                "status": AccountStatus.READY,
                "phone_number": "+1234567890",
                "last_seen": datetime.now(timezone.utc).isoformat(),
                "qr_code": None
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"message": "Account connected successfully"}

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str):
    """Delete a WhatsApp account"""
    result = await db.whatsapp_accounts.delete_one({"id": account_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    
    return {"message": "Account deleted successfully"}

@api_router.get("/accounts/{account_id}/snapshot")
async def get_snapshot(account_id: str):
    """Get snapshot for an account"""
    account = await db.whatsapp_accounts.find_one({"id": account_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if account['status'] != AccountStatus.READY:
        raise HTTPException(status_code=400, detail="Account not ready")
    
    snapshot = generate_mock_snapshot()
    timestamp = datetime.now(timezone.utc)
    
    await db.whatsapp_accounts.update_one(
        {"id": account_id},
        {
            "$set": {
                "last_snapshot": snapshot,
                "snapshot_timestamp": timestamp.isoformat()
            }
        }
    )
    
    return {
        "snapshot": snapshot,
        "timestamp": timestamp.isoformat()
    }

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
