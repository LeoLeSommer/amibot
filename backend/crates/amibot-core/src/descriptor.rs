use semver::{Version, VersionReq};
use serde::{Deserialize, Serialize};

use crate::error::{AmibotError, AmibotResult};
use crate::id::{CapabilityId, ContributionId, ModuleId, PermissionId, SlotId};

#[derive(Clone, Copy, Debug, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Web,
    Ios,
    Android,
}

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ModuleDependency {
    pub id: ModuleId,
    pub optional: bool,
}

impl ModuleDependency {
    pub fn required(id: ModuleId) -> Self {
        Self {
            id,
            optional: false,
        }
    }

    pub fn optional(id: ModuleId) -> Self {
        Self { id, optional: true }
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct UiContribution {
    pub id: ContributionId,
    pub slot: SlotId,
    pub component: String,
    pub order: i32,
    pub platforms: Option<Vec<Platform>>,
    pub permissions: Vec<PermissionId>,
    pub props: serde_json::Value,
}

impl UiContribution {
    #[allow(clippy::too_many_arguments)]
    pub fn new(
        id: ContributionId,
        slot: SlotId,
        component: impl Into<String>,
        order: i32,
        platforms: Option<Vec<Platform>>,
        permissions: Vec<PermissionId>,
        props: serde_json::Value,
    ) -> AmibotResult<Self> {
        let contribution = Self {
            id,
            slot,
            component: component.into(),
            order,
            platforms,
            permissions,
            props,
        };
        contribution.validate()?;
        Ok(contribution)
    }

    fn validate(&self) -> AmibotResult<()> {
        if self.component.trim().is_empty() {
            return Err(AmibotError::InvalidContribution {
                module: String::new(),
                reason: "component must not be empty".to_string(),
            });
        }
        if !self.props.is_object() {
            return Err(AmibotError::InvalidContribution {
                module: String::new(),
                reason: "props must be a JSON object".to_string(),
            });
        }
        Ok(())
    }
}

#[derive(Clone, Debug, PartialEq)]
pub struct ModuleDescriptor {
    pub id: ModuleId,
    pub name: String,
    pub version: Version,
    pub core: VersionReq,
    pub dependencies: Vec<ModuleDependency>,
    pub capabilities: Vec<CapabilityId>,
    pub permissions: Vec<PermissionId>,
    pub ui: Vec<UiContribution>,
}

impl ModuleDescriptor {
    pub fn validate(&self) -> AmibotResult<()> {
        if self.name.trim().is_empty() {
            return Err(AmibotError::InvalidContribution {
                module: self.id.to_string(),
                reason: "module name must not be empty".to_string(),
            });
        }

        let mut dependencies = std::collections::BTreeSet::new();
        for dependency in &self.dependencies {
            if dependency.id == self.id {
                return Err(AmibotError::SelfDependency {
                    module: self.id.to_string(),
                });
            }
            if !dependencies.insert(&dependency.id) {
                return Err(AmibotError::DuplicateDependency {
                    module: self.id.to_string(),
                    dependency: dependency.id.to_string(),
                });
            }
        }

        for contribution in &self.ui {
            contribution.validate().map_err(|error| match error {
                AmibotError::InvalidContribution { reason, .. } => {
                    AmibotError::InvalidContribution {
                        module: self.id.to_string(),
                        reason,
                    }
                }
                other => other,
            })?;
        }

        Ok(())
    }
}

pub trait Module: Send + Sync {
    fn descriptor(&self) -> &ModuleDescriptor;
}

#[cfg(test)]
mod tests {
    use super::*;

    fn descriptor() -> ModuleDescriptor {
        ModuleDescriptor {
            id: ModuleId::new("amibot_test").expect("valid module id"),
            name: "Test".to_string(),
            version: Version::new(0, 1, 0),
            core: VersionReq::parse("^0.1").expect("valid requirement"),
            dependencies: Vec::new(),
            capabilities: Vec::new(),
            permissions: Vec::new(),
            ui: Vec::new(),
        }
    }

    #[test]
    fn platforms_serialize_lowercase() {
        assert_eq!(
            serde_json::to_string(&[Platform::Web, Platform::Ios, Platform::Android])
                .expect("serialize"),
            "[\"web\",\"ios\",\"android\"]"
        );
    }

    #[test]
    fn rejects_non_object_props() {
        let result = UiContribution::new(
            ContributionId::new("button").expect("valid contribution id"),
            SlotId::new("app.header").expect("valid slot id"),
            "Button",
            0,
            None,
            Vec::new(),
            serde_json::json!("label"),
        );

        assert!(result.is_err());
    }

    #[test]
    fn rejects_empty_component() {
        let result = UiContribution::new(
            ContributionId::new("button").expect("valid contribution id"),
            SlotId::new("app.header").expect("valid slot id"),
            " ",
            0,
            None,
            Vec::new(),
            serde_json::json!({}),
        );

        assert!(result.is_err());
    }

    #[test]
    fn rejects_self_dependencies() {
        let mut descriptor = descriptor();
        descriptor.dependencies = vec![ModuleDependency::required(descriptor.id.clone())];

        assert!(descriptor.validate().is_err());
    }
}
