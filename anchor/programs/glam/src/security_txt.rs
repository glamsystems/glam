pub mod security {
    use solana_security_txt::security_txt;

    #[cfg(not(feature = "no-entrypoint"))]
    security_txt! {
        name: "GLAM Protocol",
        project_url: "https://www.glam.systems/",
        policy: "https://gui.glam.systems/vault/disclaimer",
        contacts: "email: hello@glam.systems",
        preferred_languages: "en",
        source_release: "v0.4.5",
        source_code: "https://github.com/glamsystems/glam"
    }
}
