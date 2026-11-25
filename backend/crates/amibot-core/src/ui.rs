use std::collections::{BTreeMap, BTreeSet};
use std::sync::Arc;

use crate::descriptor::{Module, ModuleDescriptor, UiContribution};
use crate::error::{AmibotError, AmibotResult};
use crate::id::{ContributionId, ModuleId, SlotId};

#[derive(Clone, Debug, PartialEq)]
pub struct UiEntry {
    pub module: ModuleId,
    pub contribution: UiContribution,
}

#[derive(Clone, Debug, Default)]
pub struct UiRegistry {
    slots: BTreeMap<SlotId, Vec<UiEntry>>,
}

impl UiRegistry {
    pub fn from_modules(modules: &[Arc<dyn Module>]) -> AmibotResult<Self> {
        Self::from_descriptors(modules.iter().map(|module| module.descriptor()))
    }

    pub fn from_descriptors<'a>(
        descriptors: impl IntoIterator<Item = &'a ModuleDescriptor>,
    ) -> AmibotResult<Self> {
        let mut seen: BTreeSet<(ModuleId, ContributionId)> = BTreeSet::new();
        let mut slots: BTreeMap<SlotId, Vec<UiEntry>> = BTreeMap::new();

        for descriptor in descriptors {
            for contribution in &descriptor.ui {
                let key = (descriptor.id.clone(), contribution.id.clone());
                if !seen.insert(key) {
                    return Err(AmibotError::DuplicateContribution {
                        module: descriptor.id.to_string(),
                        contribution: contribution.id.to_string(),
                    });
                }

                slots
                    .entry(contribution.slot.clone())
                    .or_default()
                    .push(UiEntry {
                        module: descriptor.id.clone(),
                        contribution: contribution.clone(),
                    });
            }
        }

        for entries in slots.values_mut() {
            entries.sort_by(|left, right| {
                left.contribution
                    .order
                    .cmp(&right.contribution.order)
                    .then_with(|| left.module.cmp(&right.module))
                    .then_with(|| left.contribution.id.cmp(&right.contribution.id))
            });
        }

        Ok(Self { slots })
    }

    pub fn slots(&self) -> &BTreeMap<SlotId, Vec<UiEntry>> {
        &self.slots
    }

    pub fn is_empty(&self) -> bool {
        self.slots.is_empty()
    }
}

#[cfg(test)]
mod tests {
    use semver::{Version, VersionReq};

    use super::*;
    use crate::descriptor::Platform;
    use crate::id::PermissionId;

    fn descriptor(module: &str) -> ModuleDescriptor {
        ModuleDescriptor {
            id: ModuleId::new(module).expect("valid module id"),
            name: module.to_string(),
            version: Version::new(0, 1, 0),
            core: VersionReq::parse("^0.1").expect("valid requirement"),
            dependencies: Vec::new(),
            capabilities: Vec::new(),
            permissions: Vec::new(),
            ui: Vec::new(),
        }
    }

    fn contribution(id: &str, slot: &str, order: i32) -> UiContribution {
        UiContribution::new(
            ContributionId::new(id).expect("valid contribution id"),
            SlotId::new(slot).expect("valid slot id"),
            "Button",
            order,
            Some(vec![Platform::Web]),
            vec![PermissionId::new("chat.read").expect("valid permission")],
            serde_json::json!({ "labelKey": "chat.new" }),
        )
        .expect("valid contribution")
    }

    #[test]
    fn groups_contributions_by_slot() {
        let mut left = descriptor("amibot_chat");
        left.ui.push(contribution("new", "app.header", 10));
        let mut right = descriptor("amibot_other");
        right.ui.push(contribution("other", "app.main", 0));

        let registry = UiRegistry::from_descriptors([&left, &right]).expect("registry builds");

        assert_eq!(registry.slots().len(), 2);
        assert_eq!(
            registry.slots()[&SlotId::new("app.header").expect("slot")].len(),
            1
        );
    }

    #[test]
    fn sorts_by_order_then_module_then_id() {
        let mut chat = descriptor("amibot_chat");
        chat.ui.push(contribution("b", "app.header", 10));
        chat.ui.push(contribution("a", "app.header", 10));
        let mut other = descriptor("amibot_other");
        other.ui.push(contribution("c", "app.header", 10));
        other.ui.push(contribution("first", "app.header", 0));

        let registry = UiRegistry::from_descriptors([&chat, &other]).expect("registry builds");
        let slot = SlotId::new("app.header").expect("slot");
        let ids = registry.slots()[&slot]
            .iter()
            .map(|entry| entry.contribution.id.to_string())
            .collect::<Vec<_>>();

        assert_eq!(ids, ["first", "a", "b", "c"]);
    }

    #[test]
    fn rejects_duplicate_contribution_ids_per_module() {
        let mut descriptor = descriptor("amibot_chat");
        descriptor.ui.push(contribution("new", "app.header", 0));
        descriptor.ui.push(contribution("new", "app.main", 0));

        let error = UiRegistry::from_descriptors([&descriptor])
            .expect_err("duplicate contribution rejected");

        assert!(matches!(error, AmibotError::DuplicateContribution { .. }));
    }

    #[test]
    fn allows_the_same_contribution_id_in_two_modules() {
        let mut left = descriptor("amibot_chat");
        left.ui.push(contribution("new", "app.header", 0));
        let mut right = descriptor("amibot_other");
        right.ui.push(contribution("new", "app.header", 0));

        let registry = UiRegistry::from_descriptors([&left, &right]).expect("registry builds");

        assert_eq!(
            registry.slots()[&SlotId::new("app.header").expect("slot")].len(),
            2
        );
    }
}
