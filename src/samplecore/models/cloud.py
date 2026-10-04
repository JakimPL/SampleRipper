from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from samplecore.models.base import FROZEN
from samplecore.models.scalars import Index, ModuleHash, SampleHash
from samplecore.models.tracker import TrackerFormat


class SampleCloudCoordinate(BaseModel):
    """Where one Sample sits in the library's 2D embedding space, as of one embedding run.

    A full embedding run recomputes every sample's position at once -- UMAP has no natural
    per-point incremental update -- so a later run's coordinate for a given hash entirely replaces
    an earlier one, rather than the two ever coexisting.
    """

    model_config = FROZEN

    sample_hash: SampleHash
    x: float
    y: float
    computed_at: datetime


class ModuleCloudCoordinate(BaseModel):
    """Where one Module sits in the library's 2D embedding space, as of one embedding run.

    Positions come from a UMAP fit over the distances between modules' sets of samples, so modules
    holding similar sounds sit close together. A later run's coordinate for a given hash entirely
    replaces an earlier one, mirroring SampleCloudCoordinate's own replacement semantics.
    """

    model_config = FROZEN

    module_hash: ModuleHash
    x: float
    y: float
    computed_at: datetime


class PlacedModule(BaseModel):
    """A module's coordinate together with the tracker format its file is written in.

    A viewer paints each module of the cloud in its format's color, and a module's format is fixed
    by its own bytes, so the two are read together and travel as one.
    """

    model_config = FROZEN

    coordinate: ModuleCloudCoordinate
    tracker: TrackerFormat


class CloudPromotion(BaseModel):
    """Which experiment's vectors the cloud shows, and since when.

    Recorded in the same transaction that writes the coordinates, so the record and the points never
    disagree, and it is what lets a rebuild resume the experiment on show rather than start another.
    """

    model_config = FROZEN

    experiment_id: Index
    promoted_at: datetime
