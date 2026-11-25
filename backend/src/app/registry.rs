use std::sync::Arc;

use amibot_runtime::RuntimeModule;

/// The single wiring point for official modules. Add future runtime modules
/// here; registration and routing follow automatically.
pub fn modules() -> Vec<Arc<dyn RuntimeModule>> {
    Vec::new()
}
