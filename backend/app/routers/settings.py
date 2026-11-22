"""AutoExpert — User Settings & Preferences API Router."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.app.database import get_db
from backend.app.models.db_models import UserPreferences
from backend.app.schemas.api_schemas import SettingsUpdate

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("")
def get_settings(db: Session = Depends(get_db)):
    pref = db.query(UserPreferences).first()
    if not pref:
        pref = UserPreferences(
            distance_unit="km",
            pressure_unit="psi",
            default_demo_playback_ms=500,
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref.to_dict()


@router.put("")
def update_settings(payload: SettingsUpdate, db: Session = Depends(get_db)):
    pref = db.query(UserPreferences).first()
    if not pref:
        pref = UserPreferences()
        db.add(pref)

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(pref, key, val)

    db.commit()
    db.refresh(pref)
    return pref.to_dict()
