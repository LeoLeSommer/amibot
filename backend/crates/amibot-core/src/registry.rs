use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

use semver::Version;

use crate::activation::ActivationState;
use crate::descriptor::{Module, ModuleDescriptor};
use crate::error::{AmibotError, AmibotResult};
use crate::id::{CapabilityId, ContributionId, ModuleId};

#[derive(Debug, Default)]
pub struct CapabilityRegistry {
    owners: BTreeMap<CapabilityId, ModuleId>,
}

impl CapabilityRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register_module(
        &mut self,
        module: &ModuleId,
        capabilities: &[CapabilityId],
    ) -> AmibotResult<()> {
        let mut local = BTreeSet::new();
        for capability in capabilities {
            if !local.insert(capability) {
                return Err(AmibotError::DuplicateCapability {
                    capability: capability.to_string(),
                    module: module.to_string(),
                });
            }
        }

        for capability in capabilities {
            if self.owners.contains_key(capability) {
                return Err(AmibotError::DuplicateCapability {
                    capability: capability.to_string(),
                    module: module.to_string(),
                });
            }
        }

        for capability in capabilities {
            self.owners.insert(capability.clone(), module.clone());
        }

        Ok(())
    }

    pub fn owner(&self, capability: &CapabilityId) -> Option<&ModuleId> {
        self.owners.get(capability)
    }

    pub fn len(&self) -> usize {
        self.owners.len()
    }

    pub fn is_empty(&self) -> bool {
        self.owners.is_empty()
    }
}

#[derive(Default)]
pub struct ModuleRegistry {
    modules: BTreeMap<ModuleId, Arc<dyn Module>>,
    capabilities: CapabilityRegistry,
    contributions: BTreeSet<(ModuleId, ContributionId)>,
}

impl ModuleRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn register(&mut self, module: Arc<dyn Module>) -> AmibotResult<()> {
        let descriptor = module.descriptor();
        descriptor.validate()?;

        let id = descriptor.id.clone();
        if self.modules.contains_key(&id) {
            return Err(AmibotError::DuplicateModule(id.to_string()));
        }

        let mut module_contributions = BTreeSet::new();
        for contribution in &descriptor.ui {
            let key = (id.clone(), contribution.id.clone());
            if !module_contributions.insert(key.clone()) || self.contributions.contains(&key) {
                return Err(AmibotError::DuplicateContribution {
                    module: id.to_string(),
                    contribution: contribution.id.to_string(),
                });
            }
        }

        self.capabilities
            .register_module(&id, &descriptor.capabilities)?;
        self.contributions.extend(module_contributions);

        self.modules.insert(id, module);
        Ok(())
    }

    pub fn len(&self) -> usize {
        self.modules.len()
    }

    pub fn is_empty(&self) -> bool {
        self.modules.is_empty()
    }

    pub fn ids(&self) -> Vec<ModuleId> {
        self.modules.keys().cloned().collect()
    }

    pub fn descriptor(&self, module: &ModuleId) -> Option<&ModuleDescriptor> {
        self.modules.get(module).map(|module| module.descriptor())
    }

    pub fn capabilities(&self) -> &CapabilityRegistry {
        &self.capabilities
    }

    /// Resolves the active module set. Dependencies are validated and the
    /// resolved modules are returned in deterministic topological order, with
    /// module IDs as the tie-breaker.
    pub fn resolve(
        &self,
        core_version: &Version,
        activation: &ActivationState,
    ) -> AmibotResult<Vec<Arc<dyn Module>>> {
        let active: BTreeSet<ModuleId> = self
            .modules
            .keys()
            .filter(|id| activation.is_enabled(id))
            .cloned()
            .collect();

        for id in &active {
            let descriptor = self
                .modules
                .get(id)
                .map(|module| module.descriptor())
                .ok_or_else(|| AmibotError::DuplicateModule(id.to_string()))?;

            if !descriptor.core.matches(core_version) {
                return Err(AmibotError::CoreIncompatible {
                    module: id.to_string(),
                    requirement: descriptor.core.to_string(),
                    current: core_version.to_string(),
                });
            }
        }

        let mut indegree: BTreeMap<ModuleId, usize> = BTreeMap::new();
        let mut dependents: BTreeMap<ModuleId, BTreeSet<ModuleId>> = BTreeMap::new();

        for id in &active {
            let descriptor = self
                .modules
                .get(id)
                .map(|module| module.descriptor())
                .ok_or_else(|| AmibotError::DuplicateModule(id.to_string()))?;

            let mut count = 0;
            for dependency in &descriptor.dependencies {
                if !self.modules.contains_key(&dependency.id) {
                    if dependency.optional {
                        continue;
                    }
                    return Err(AmibotError::MissingDependency {
                        module: id.to_string(),
                        dependency: dependency.id.to_string(),
                    });
                }

                if !activation.is_enabled(&dependency.id) {
                    if dependency.optional {
                        continue;
                    }
                    return Err(AmibotError::DisabledDependency {
                        module: id.to_string(),
                        dependency: dependency.id.to_string(),
                    });
                }

                count += 1;
                dependents
                    .entry(dependency.id.clone())
                    .or_default()
                    .insert(id.clone());
            }
            indegree.insert(id.clone(), count);
        }

        let mut ready: BTreeSet<ModuleId> = indegree
            .iter()
            .filter(|(_, count)| **count == 0)
            .map(|(id, _)| id.clone())
            .collect();
        let mut ordered = Vec::with_capacity(active.len());

        while let Some(id) = ready.pop_first() {
            if let Some(module_dependents) = dependents.get(&id) {
                for dependent in module_dependents {
                    if let Some(count) = indegree.get_mut(dependent) {
                        *count -= 1;
                        if *count == 0 {
                            ready.insert(dependent.clone());
                        }
                    }
                }
            }
            ordered.push(id);
        }

        if ordered.len() != active.len() {
            let cycle = indegree
                .iter()
                .filter(|(_, count)| **count > 0)
                .map(|(id, _)| id.to_string())
                .collect::<Vec<_>>()
                .join(", ");
            return Err(AmibotError::DependencyCycle(cycle));
        }

        ordered
            .into_iter()
            .map(|id| {
                self.modules
                    .get(&id)
                    .cloned()
                    .ok_or(AmibotError::DuplicateModule(id.to_string()))
            })
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::activation::ActivationEntry;
    use crate::descriptor::{ModuleDependency, UiContribution};
    use crate::id::{PermissionId, SlotId};
    use semver::VersionReq;

    struct TestModule {
        descriptor: ModuleDescriptor,
    }

    impl TestModule {
        fn new(id: &str) -> Self {
            Self {
                descriptor: ModuleDescriptor {
                    id: ModuleId::new(id).expect("valid module id"),
                    name: id.to_string(),
                    version: Version::new(0, 1, 0),
                    core: VersionReq::parse("^0.1").expect("valid requirement"),
                    dependencies: Vec::new(),
                    capabilities: Vec::new(),
                    permissions: Vec::new(),
                    ui: Vec::new(),
                },
            }
        }

        fn dependency(mut self, id: &str, optional: bool) -> Self {
            self.descriptor.dependencies.push(ModuleDependency {
                id: ModuleId::new(id).expect("valid dependency id"),
                optional,
            });
            self
        }

        fn capability(mut self, capability: &str) -> Self {
            self.descriptor
                .capabilities
                .push(CapabilityId::new(capability).expect("valid capability"));
            self
        }

        fn core(mut self, requirement: &str) -> Self {
            self.descriptor.core = VersionReq::parse(requirement).expect("valid requirement");
            self
        }

        fn contribution(mut self, id: &str) -> Self {
            self.descriptor.ui.push(
                UiContribution::new(
                    ContributionId::new(id).expect("valid contribution id"),
                    SlotId::new("app.main").expect("valid slot id"),
                    "Button",
                    0,
                    None,
                    vec![PermissionId::new("chat.read").expect("valid permission")],
                    serde_json::json!({}),
                )
                .expect("valid contribution"),
            );
            self
        }
    }

    impl Module for TestModule {
        fn descriptor(&self) -> &ModuleDescriptor {
            &self.descriptor
        }
    }

    fn register(registry: &mut ModuleRegistry, module: TestModule) {
        registry
            .register(Arc::new(module))
            .expect("module registers");
    }

    fn core() -> Version {
        Version::new(0, 1, 0)
    }

    fn activation(entries: &[(&str, bool)]) -> ActivationState {
        let known: Vec<ModuleId> = entries
            .iter()
            .map(|(id, _)| ModuleId::new(*id).expect("valid module id"))
            .collect();
        ActivationState::from_entries(
            entries
                .iter()
                .map(|(id, enabled)| ActivationEntry::new(*id, *enabled)),
            &known,
        )
        .0
    }

    fn resolved_ids(registry: &ModuleRegistry, state: &ActivationState) -> Vec<String> {
        registry
            .resolve(&core(), state)
            .expect("modules resolve")
            .iter()
            .map(|module| module.descriptor().id.to_string())
            .collect()
    }

    #[test]
    fn resolves_an_empty_registry() {
        let registry = ModuleRegistry::new();
        let resolved = registry
            .resolve(&core(), &ActivationState::default())
            .expect("empty registry resolves");

        assert!(resolved.is_empty());
    }

    #[test]
    fn rejects_duplicate_modules() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_chat"));

        let error = registry
            .register(Arc::new(TestModule::new("amibot_chat")))
            .expect_err("duplicate module rejected");

        assert!(matches!(error, AmibotError::DuplicateModule(_)));
    }

    #[test]
    fn rejects_duplicate_capabilities_across_modules() {
        let mut registry = ModuleRegistry::new();
        register(
            &mut registry,
            TestModule::new("amibot_chat").capability("chat.messages"),
        );

        let error = registry
            .register(Arc::new(
                TestModule::new("amibot_other").capability("chat.messages"),
            ))
            .expect_err("duplicate capability rejected");

        assert!(matches!(error, AmibotError::DuplicateCapability { .. }));
    }

    #[test]
    fn rejects_duplicate_contributions_in_a_module() {
        let mut registry = ModuleRegistry::new();
        let error = registry
            .register(Arc::new(
                TestModule::new("amibot_chat")
                    .contribution("new_conversation")
                    .contribution("new_conversation"),
            ))
            .expect_err("duplicate contribution rejected");

        assert!(matches!(error, AmibotError::DuplicateContribution { .. }));
    }

    #[test]
    fn maps_capabilities_to_their_module() {
        let mut registry = ModuleRegistry::new();
        register(
            &mut registry,
            TestModule::new("amibot_chat").capability("chat.messages"),
        );

        let capability = CapabilityId::new("chat.messages").expect("valid capability");
        let owner = registry
            .capabilities()
            .owner(&capability)
            .expect("capability has an owner");

        assert_eq!(owner.as_str(), "amibot_chat");
    }

    #[test]
    fn resolves_modules_without_dependencies_in_id_order() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_zeta"));
        register(&mut registry, TestModule::new("amibot_alpha"));

        let ids = resolved_ids(&registry, &ActivationState::default());

        assert_eq!(ids, ["amibot_alpha", "amibot_zeta"]);
    }

    #[test]
    fn resolves_dependencies_before_dependents() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_aaa"));
        register(
            &mut registry,
            TestModule::new("amibot_zzz").dependency("amibot_aaa", false),
        );

        let ids = resolved_ids(&registry, &ActivationState::default());

        assert_eq!(ids, ["amibot_aaa", "amibot_zzz"]);
    }

    #[test]
    fn missing_optional_dependencies_are_ignored() {
        let mut registry = ModuleRegistry::new();
        register(
            &mut registry,
            TestModule::new("amibot_chat").dependency("amibot_missing", true),
        );

        let ids = resolved_ids(&registry, &ActivationState::default());

        assert_eq!(ids, ["amibot_chat"]);
    }

    #[test]
    fn missing_required_dependencies_fail() {
        let mut registry = ModuleRegistry::new();
        register(
            &mut registry,
            TestModule::new("amibot_chat").dependency("amibot_missing", false),
        );

        let error = registry
            .resolve(&core(), &ActivationState::default())
            .err()
            .expect("missing dependency rejected");

        assert!(matches!(error, AmibotError::MissingDependency { .. }));
    }

    #[test]
    fn disabled_required_dependencies_fail() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_auth"));
        register(
            &mut registry,
            TestModule::new("amibot_chat").dependency("amibot_auth", false),
        );

        let error = registry
            .resolve(&core(), &activation(&[("amibot_auth", false)]))
            .err()
            .expect("disabled dependency rejected");

        assert!(matches!(error, AmibotError::DisabledDependency { .. }));
    }

    #[test]
    fn disabled_optional_dependencies_are_ignored() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_auth"));
        register(
            &mut registry,
            TestModule::new("amibot_chat").dependency("amibot_auth", true),
        );

        let ids = resolved_ids(&registry, &activation(&[("amibot_auth", false)]));

        assert_eq!(ids, ["amibot_chat"]);
    }

    #[test]
    fn disabled_modules_are_not_resolved() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_chat"));

        let ids = resolved_ids(&registry, &activation(&[("amibot_chat", false)]));

        assert!(ids.is_empty());
    }

    #[test]
    fn dependency_cycles_are_rejected() {
        let mut registry = ModuleRegistry::new();
        register(
            &mut registry,
            TestModule::new("amibot_alpha").dependency("amibot_beta", false),
        );
        register(
            &mut registry,
            TestModule::new("amibot_beta").dependency("amibot_alpha", false),
        );

        let error = registry
            .resolve(&core(), &ActivationState::default())
            .err()
            .expect("cycle rejected");

        assert!(matches!(error, AmibotError::DependencyCycle(_)));
    }

    #[test]
    fn self_dependencies_are_rejected_at_registration() {
        let mut registry = ModuleRegistry::new();
        let error = registry
            .register(Arc::new(
                TestModule::new("amibot_chat").dependency("amibot_chat", false),
            ))
            .expect_err("self dependency rejected");

        assert!(matches!(error, AmibotError::SelfDependency { .. }));
    }

    #[test]
    fn incompatible_core_requirements_fail() {
        let mut registry = ModuleRegistry::new();
        register(&mut registry, TestModule::new("amibot_chat").core("^1.0"));

        let error = registry
            .resolve(&core(), &ActivationState::default())
            .err()
            .expect("incompatible core rejected");

        assert!(matches!(error, AmibotError::CoreIncompatible { .. }));
    }
}
