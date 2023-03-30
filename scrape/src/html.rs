use lazy_static::lazy_static;
use regex::Regex;

use crate::source::SourceType;

lazy_static! {
    static ref STYLE_TAG_REGEX: Regex =
        Regex::new(r"<style(?:.+)?>(?P<css>[\S\s]+)</style>").unwrap();
}

pub(crate) fn search_html(html: &str) -> Vec<SourceType> {
    let mut sources = Vec::new();
    for keyword_captures in STYLE_TAG_REGEX.captures_iter(html) {
        let css = keyword_captures.name("css").unwrap().as_str().to_string();
        sources.push(SourceType::StyleTagCss { css })
    }
    sources
}
