use std::cmp::min;

use lazy_static::lazy_static;
use regex::Regex;

use crate::source::SourceType;

lazy_static! {
    static ref STYLE_TAG_REGEX: Regex = Regex::new(
        r#"(?:<style(?:.+)?>(?P<css>[\S\s]+)</style>|<link(?:.+)href="(?P<css_url>.+)"(?:.+)/?>)"#
    )
    .unwrap();
}

pub(crate) fn search_html(doc_url: &String, html: &str) -> Vec<SourceType> {
    let mut sources = Vec::new();
    for keyword_captures in STYLE_TAG_REGEX.captures_iter(html) {
        if let Some(css) = keyword_captures.name("css").map(|s| s.as_str().to_string()) {
            sources.push(SourceType::StyleTagCss { css });
        }
        if let Some(css_url) = keyword_captures
            .name("css_url")
            .map(|s| s.as_str().to_string())
        {
            sources.push(SourceType::LinkedCssFile {
                url: map_resource_url_to_document(css_url, doc_url),
            });
        }
    }
    sources
}

fn map_resource_url_to_document(resource_url: String, document_url: &String) -> String {
    if resource_url.starts_with("https://") || resource_url.starts_with("http://") {
        resource_url
    } else {
        let host_start_index = document_url.find("://").unwrap() + 3;
        if resource_url.starts_with('/') {
            match document_url[host_start_index..].find('/') {
                None => format!("{document_url}{resource_url}"),
                Some(host_length) => format!(
                    "{}/{}",
                    &document_url[0..host_start_index + host_length],
                    &resource_url.strip_prefix('/').unwrap(),
                ),
            }
        } else if resource_url.starts_with("../") {
            let document_post_protocol = document_url[host_start_index..].to_string();
            let protocol = document_url[0..host_start_index].to_string();
            let host = match &document_post_protocol.find('/') {
                None => document_post_protocol.clone(),
                Some(host_length) => document_post_protocol[0..*host_length].to_string(),
            };
            let resource_filename =
                resource_url[resource_url.rfind('/').unwrap() + 1..].to_string();
            let mut document_post_host =
                document_post_protocol.strip_prefix(host.as_str()).unwrap();
            if let Some(stripped_leading_slash) = document_post_host.strip_prefix('/') {
                document_post_host = stripped_leading_slash;
            }
            let document_intermediary_paths: Vec<String> = match document_post_host.rfind('/') {
                None => Vec::new(),
                Some(document_filename_slash_index) => document_post_host
                    [0..document_filename_slash_index]
                    .to_string()
                    .split('/')
                    .map(|s| s.to_string())
                    .collect(),
            };
            let up_path_indices: Vec<_> = resource_url.match_indices("../").collect();
            let intermediary_path_count = document_intermediary_paths.len()
                - min(document_intermediary_paths.len(), up_path_indices.len());
            if intermediary_path_count == 0 {
                format!("{protocol}{host}/{resource_filename}")
            } else {
                let mut intermediary_paths = Vec::with_capacity(intermediary_path_count);
                for (i, dip) in document_intermediary_paths.iter().enumerate() {
                    if i == intermediary_path_count {
                        break;
                    }
                    intermediary_paths.insert(i, dip.clone());
                }
                let resource_intermediary_paths = intermediary_paths.join("/");
                format!("{protocol}{host}/{resource_intermediary_paths}/{resource_filename}")
            }
        } else {
            match document_url[host_start_index..].rfind('/') {
                None => format!("{document_url}/{resource_url}"),
                Some(post_host_slash_index) => {
                    format!(
                        "{}/{resource_url}",
                        &document_url[0..host_start_index + post_host_slash_index]
                    )
                }
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_map_resource_url_to_document_when_at_document_path() {
        assert_map_resource_url(
            "https://host/file.css",
            "file.css",
            "https://host/index.html",
        );
        assert_map_resource_url("https://host/file.css", "file.css", "https://host/");
        assert_map_resource_url("https://host/file.css", "file.css", "https://host");
        assert_map_resource_url(
            "https://host/path/path/file.css",
            "file.css",
            "https://host/path/path/index.html",
        );
        assert_map_resource_url(
            "https://host/path/path/file.css",
            "file.css",
            "https://host/path/path/",
        );
        assert_map_resource_url(
            "https://host/path/file.css",
            "file.css",
            "https://host/path/path",
        );
    }

    #[test]
    fn test_map_resource_url_to_document_when_at_document_host_root() {
        assert_map_resource_url(
            "https://host/file.css",
            "/file.css",
            "https://host/index.html",
        );
        assert_map_resource_url("https://host/file.css", "/file.css", "https://host/");
        assert_map_resource_url("https://host/file.css", "/file.css", "https://host");
        assert_map_resource_url(
            "https://host/file.css",
            "/file.css",
            "https://host/path/path/index.html",
        );
        assert_map_resource_url(
            "https://host/file.css",
            "/file.css",
            "https://host/path/path/",
        );
        assert_map_resource_url(
            "https://host/file.css",
            "/file.css",
            "https://host/path/path",
        );
    }

    #[test]
    fn test_map_resource_url_to_document_when_relative_to_document() {
        assert_map_resource_url(
            "https://host/path1/file.css",
            "../file.css",
            "https://host/path1/path2/index.html",
        );
        assert_map_resource_url(
            "https://host/file.css",
            "../../file.css",
            "https://host/path1/path2/index.html",
        );
        assert_map_resource_url(
            "https://host/path1/file.css",
            "../../file.css",
            "https://host/path1/path2/path3/index.html",
        );
        assert_map_resource_url(
            "https://host/file.css",
            "../../file.css",
            "https://host/path/index.html",
        );
        assert_map_resource_url(
            "https://host/file.css",
            "../../file.css",
            "https://host/index.html",
        );
        assert_map_resource_url("https://host/file.css", "../../file.css", "https://host/");
        assert_map_resource_url("https://host/file.css", "../../file.css", "https://host");
    }

    fn assert_map_resource_url(expected: &str, res_url: &str, doc_url: &str) {
        assert_eq!(
            expected.to_string(),
            map_resource_url_to_document(res_url.to_string(), &doc_url.to_string())
        );
    }
}
