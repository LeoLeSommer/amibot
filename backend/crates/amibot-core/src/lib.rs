pub mod activation;
pub mod client_version;
pub mod descriptor;
pub mod error;
pub mod id;
pub mod manifest;
pub mod registry;
pub mod ui;

pub use activation::{ActivationEntry, ActivationState};
pub use client_version::{
    API_VERSION, CLIENT_API_VERSION_HEADER, ClientVersion, ClientVersionError,
    MIN_CLIENT_API_VERSION, is_update_required, parse_client_version,
};
pub use descriptor::{Module, ModuleDependency, ModuleDescriptor, Platform, UiContribution};
pub use error::{AmibotError, AmibotResult};
pub use id::{CapabilityId, ContributionId, ModuleId, PermissionId, SlotId};
pub use manifest::{
    Compatibility, CoreInfo, Manifest, ManifestBuilder, ManifestCapability, ManifestModule,
    ServerInfo, SlotContribution, UiManifest, build_manifest,
};
pub use registry::{CapabilityRegistry, ModuleRegistry};
pub use ui::{UiEntry, UiRegistry};

pub const CORE_VERSION: &str = env!("CARGO_PKG_VERSION");
