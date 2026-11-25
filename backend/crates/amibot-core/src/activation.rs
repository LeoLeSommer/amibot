use std::collections::{BTreeSet, HashSet};

use crate::id::ModuleId;

#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ActivationEntry {
    pub module_id: String,
    pub enabled: bool,
}

impl ActivationEntry {
    pub fn new(module_id: impl Into<String>, enabled: bool) -> Self {
        Self {
            module_id: module_id.into(),
            enabled,
        }
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct ActivationState {
    disabled: BTreeSet<String>,
}

impl ActivationState {
    /// Builds the activation view from database rows. A module without a row is
    /// enabled. Rows that reference modules missing from the compiled registry
    /// are returned separately so the caller can log them.
    pub fn from_entries(
        entries: impl IntoIterator<Item = ActivationEntry>,
        known: &[ModuleId],
    ) -> (Self, Vec<String>) {
        let known: HashSet<&str> = known.iter().map(ModuleId::as_str).collect();
        let mut disabled = BTreeSet::new();
        let mut unknown = BTreeSet::new();

        for entry in entries {
            if !known.contains(entry.module_id.as_str()) {
                unknown.insert(entry.module_id);
                continue;
            }
            if entry.enabled {
                disabled.remove(&entry.module_id);
            } else {
                disabled.insert(entry.module_id);
            }
        }

        (Self { disabled }, unknown.into_iter().collect())
    }

    pub fn is_enabled(&self, module_id: &ModuleId) -> bool {
        !self.disabled.contains(module_id.as_str())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn known() -> Vec<ModuleId> {
        vec![
            ModuleId::new("amibot_chat").expect("valid module id"),
            ModuleId::new("amibot_identity").expect("valid module id"),
        ]
    }

    #[test]
    fn missing_rows_keep_modules_enabled() {
        let (state, unknown) = ActivationState::from_entries(Vec::new(), &known());

        assert!(unknown.is_empty());
        assert!(state.is_enabled(&known()[0]));
        assert!(state.is_enabled(&known()[1]));
    }

    #[test]
    fn disabled_rows_turn_modules_off() {
        let (state, unknown) =
            ActivationState::from_entries([ActivationEntry::new("amibot_chat", false)], &known());

        assert!(unknown.is_empty());
        assert!(!state.is_enabled(&known()[0]));
        assert!(state.is_enabled(&known()[1]));
    }

    #[test]
    fn unknown_rows_are_reported_and_ignored() {
        let (state, unknown) = ActivationState::from_entries(
            [
                ActivationEntry::new("amibot_missing", false),
                ActivationEntry::new("amibot_chat", false),
            ],
            &known(),
        );

        assert_eq!(unknown, vec!["amibot_missing".to_string()]);
        assert!(!state.is_enabled(&known()[0]));
    }

    #[test]
    fn later_enabled_rows_override_earlier_ones() {
        let (state, _) = ActivationState::from_entries(
            [
                ActivationEntry::new("amibot_chat", false),
                ActivationEntry::new("amibot_chat", true),
            ],
            &known(),
        );

        assert!(state.is_enabled(&known()[0]));
    }
}
