use std::fmt;
use std::str::FromStr;

use serde::de::{self, Deserialize, Deserializer};
use serde::ser::{Serialize, Serializer};

use crate::error::AmibotError;

fn is_lowercase_segment(value: &str) -> bool {
    let mut bytes = value.bytes();
    match bytes.next() {
        Some(first) if first.is_ascii_lowercase() => {}
        _ => return false,
    }
    bytes.all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'_')
}

fn is_valid_module_id(value: &str) -> bool {
    value.len() >= 3 && value.len() <= 64 && is_lowercase_segment(value)
}

fn is_valid_segmented_id(value: &str) -> bool {
    value.len() <= 128 && !value.is_empty() && value.split('.').all(is_lowercase_segment)
}

fn is_valid_contribution_id(value: &str) -> bool {
    value.len() <= 64 && is_lowercase_segment(value)
}

macro_rules! id_type {
    ($name:ident, $kind:literal, $validator:ident) => {
        #[derive(Clone, Debug, PartialEq, Eq, PartialOrd, Ord, Hash)]
        pub struct $name(String);

        impl $name {
            pub fn new(value: impl Into<String>) -> Result<Self, AmibotError> {
                let value = value.into();
                if $validator(&value) {
                    Ok(Self(value))
                } else {
                    Err(AmibotError::InvalidId { kind: $kind, value })
                }
            }

            pub fn as_str(&self) -> &str {
                &self.0
            }
        }

        impl fmt::Display for $name {
            fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
                formatter.write_str(&self.0)
            }
        }

        impl AsRef<str> for $name {
            fn as_ref(&self) -> &str {
                &self.0
            }
        }

        impl FromStr for $name {
            type Err = AmibotError;

            fn from_str(value: &str) -> Result<Self, Self::Err> {
                Self::new(value)
            }
        }

        impl TryFrom<String> for $name {
            type Error = AmibotError;

            fn try_from(value: String) -> Result<Self, Self::Error> {
                Self::new(value)
            }
        }

        impl Serialize for $name {
            fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
            where
                S: Serializer,
            {
                serializer.serialize_str(&self.0)
            }
        }

        impl<'de> Deserialize<'de> for $name {
            fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
            where
                D: Deserializer<'de>,
            {
                let value = String::deserialize(deserializer)?;
                Self::new(value).map_err(de::Error::custom)
            }
        }
    };
}

id_type!(ModuleId, "module", is_valid_module_id);
id_type!(CapabilityId, "capability", is_valid_segmented_id);
id_type!(PermissionId, "permission", is_valid_segmented_id);
id_type!(SlotId, "slot", is_valid_segmented_id);
id_type!(ContributionId, "contribution", is_valid_contribution_id);

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_module_ids() {
        assert!(ModuleId::new("amibot_chat").is_ok());
        assert!(ModuleId::new("abc").is_ok());
        assert!(ModuleId::new("amibot_chat_2").is_ok());
    }

    #[test]
    fn rejects_invalid_module_ids() {
        assert!(ModuleId::new("").is_err());
        assert!(ModuleId::new("ab").is_err());
        assert!(ModuleId::new("Amibot_chat").is_err());
        assert!(ModuleId::new("1amibot").is_err());
        assert!(ModuleId::new("amibot-chat").is_err());
        assert!(ModuleId::new("amibot.chat").is_err());
        assert!(ModuleId::new("a".repeat(65)).is_err());
    }

    #[test]
    fn accepts_segmented_ids() {
        assert!(CapabilityId::new("chat.messages").is_ok());
        assert!(SlotId::new("app.header").is_ok());
        assert!(SlotId::new("app").is_ok());
        assert!(PermissionId::new("chat.write_2").is_ok());
    }

    #[test]
    fn rejects_invalid_segmented_ids() {
        assert!(CapabilityId::new("").is_err());
        assert!(CapabilityId::new("Chat.messages").is_err());
        assert!(CapabilityId::new("chat..messages").is_err());
        assert!(CapabilityId::new("chat.Messages").is_err());
        assert!(CapabilityId::new("chat.").is_err());
        assert!(CapabilityId::new(".chat").is_err());
        assert!(CapabilityId::new("9chat.messages").is_err());
    }

    #[test]
    fn contribution_ids_are_single_segments() {
        assert!(ContributionId::new("new_conversation").is_ok());
        assert!(ContributionId::new("a").is_ok());
        assert!(ContributionId::new("new.conversation").is_err());
        assert!(ContributionId::new("New").is_err());
    }

    #[test]
    fn ids_serialize_as_strings() {
        let id = ModuleId::new("amibot_chat").expect("valid id");
        assert_eq!(
            serde_json::to_string(&id).expect("serialize"),
            "\"amibot_chat\""
        );
        let parsed: ModuleId =
            serde_json::from_str("\"amibot_chat\"").expect("deserialize valid id");
        assert_eq!(parsed, id);
        assert!(serde_json::from_str::<ModuleId>("\"Amibot\"").is_err());
    }
}
