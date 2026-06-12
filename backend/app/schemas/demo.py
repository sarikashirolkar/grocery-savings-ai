from pydantic import BaseModel


class DemoRegionOut(BaseModel):
    active_region: str
    available_regions: list[str]


class DemoRegionUpdate(BaseModel):
    region: str
