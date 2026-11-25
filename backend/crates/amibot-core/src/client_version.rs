use thiserror::Error;

pub const CLIENT_API_VERSION_HEADER: &str = "x-client-api-version";
pub const API_VERSION: u32 = 1;

/// Oldest client API contract the server still accepts.
pub const MIN_CLIENT_API_VERSION: u32 = 1;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum ClientVersion {
    Missing,
    Valid(u32),
}

#[derive(Clone, Copy, Debug, Error, PartialEq, Eq)]
#[error("invalid client API version header")]
pub struct ClientVersionError;

/// Parses the optional `X-Client-Api-Version` header value. Requests without a
/// header predate the contract and stay compatible.
pub fn parse_client_version(value: Option<&str>) -> Result<ClientVersion, ClientVersionError> {
    let Some(value) = value else {
        return Ok(ClientVersion::Missing);
    };

    let value = value.trim();
    if value.is_empty() {
        return Err(ClientVersionError);
    }

    value
        .parse::<u32>()
        .map(ClientVersion::Valid)
        .map_err(|_| ClientVersionError)
}

pub fn is_update_required(version: u32) -> bool {
    version < MIN_CLIENT_API_VERSION
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn missing_header_is_accepted() {
        assert_eq!(
            parse_client_version(None).expect("missing header parses"),
            ClientVersion::Missing
        );
    }

    #[test]
    fn valid_versions_are_parsed() {
        assert_eq!(
            parse_client_version(Some("1")).expect("valid version"),
            ClientVersion::Valid(1)
        );
        assert_eq!(
            parse_client_version(Some(" 42 ")).expect("valid version"),
            ClientVersion::Valid(42)
        );
    }

    #[test]
    fn invalid_versions_are_rejected() {
        assert_eq!(parse_client_version(Some("")), Err(ClientVersionError));
        assert_eq!(parse_client_version(Some("abc")), Err(ClientVersionError));
        assert_eq!(parse_client_version(Some("-1")), Err(ClientVersionError));
        assert_eq!(parse_client_version(Some("1.5")), Err(ClientVersionError));
    }

    #[test]
    fn versions_below_the_minimum_require_an_update() {
        assert!(is_update_required(MIN_CLIENT_API_VERSION - 1));
        assert!(!is_update_required(MIN_CLIENT_API_VERSION));
        assert!(!is_update_required(MIN_CLIENT_API_VERSION + 1));
    }
}
