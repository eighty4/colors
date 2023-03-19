use std::collections::{HashMap, HashSet};

use lazy_static::lazy_static;
use regex::Regex;

use crate::Color;

mod keyword;

lazy_static! {
    static ref COLOR_KEYWORDS: HashMap<&'static str, &'static str> = keyword::colors();
    static ref HEX_REGEX: Regex = Regex::new(r"#[\da-fA-F]{3}(?:[\da-fA-F]{3,5})?").unwrap();
    static ref KEYWORD_REGEX: Regex = Regex::new(
        COLOR_KEYWORDS
            .keys()
            .map(|s| &**s)
            .collect::<Vec<_>>()
            .join("|")
            .as_str()
    )
    .unwrap();
    static ref RGB_REGEX: Regex =
        Regex::new(r"rgba?\(\s*\d\d?\d?\s*,\s*\d\d?\d?\s*,\s*\d\d?\d?\s*(?:,\s*\d\d?\d?\s*)?\)")
            .unwrap();
}

#[allow(dead_code)]
pub(crate) fn extract_colors(css: &'static str) -> HashSet<Color> {
    let mut colors = HashSet::new();
    for hex_match in HEX_REGEX.find_iter(css) {
        let mut hex_str = hex_match.as_str();
        if hex_str.starts_with('#') {
            hex_str = &hex_str[1..];
        }
        colors.insert(parse_hex_rgb_str(hex_str));
    }
    for rgb_match in RGB_REGEX.find_iter(css) {
        let rgb_str = rgb_match.as_str();
        let rgb_fn_args_str = &rgb_str[1 + rgb_str.find('(').unwrap()..rgb_str.find(')').unwrap()];
        let rgb_fn_args: Vec<u8> = rgb_fn_args_str
            .split(',')
            .map(|s| s.trim())
            .map(|s| s.parse::<u8>().unwrap())
            .collect();
        let color = match rgb_fn_args.len() {
            3 => Color::rgb(
                *rgb_fn_args.first().unwrap(),
                *rgb_fn_args.get(1).unwrap(),
                *rgb_fn_args.get(2).unwrap(),
            ),
            4 => Color::rgba(
                *rgb_fn_args.first().unwrap(),
                *rgb_fn_args.get(1).unwrap(),
                *rgb_fn_args.get(2).unwrap(),
                *rgb_fn_args.get(3).unwrap(),
            ),
            _ => panic!(),
        };
        colors.insert(color);
    }
    for keyword_match in KEYWORD_REGEX.find_iter(css) {
        let hex_rgb = COLOR_KEYWORDS.get(keyword_match.as_str()).unwrap();
        colors.insert(parse_hex_rgb_str(hex_rgb));
    }
    colors
}

fn parse_hex_rgb_str(hex_rgb: &'static str) -> Color {
    match hex_rgb.len() {
        3 => Color::rgb(
            u8::from_str_radix(&hex_rgb[0..1], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[1..2], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[2..3], 16).unwrap(),
        ),
        6 => Color::rgb(
            u8::from_str_radix(&hex_rgb[0..2], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[2..4], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[4..6], 16).unwrap(),
        ),
        8 => Color::rgba(
            u8::from_str_radix(&hex_rgb[0..2], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[2..4], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[4..6], 16).unwrap(),
            u8::from_str_radix(&hex_rgb[6..8], 16).unwrap(),
        ),
        _ => panic!(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extracts_hex_colors() {
        let css = r"
.selector {
    background: #000;
    border-color: #000000ee;
    color: #ffffff;
}";
        assert_eq!(extract_colors(css).len(), 3);
    }

    #[test]
    fn test_extracts_rgb_colors() {
        let css = r"
.selector {
    background: rgb(12, 45, 78);
    border-color: rgb(123,45,78);
    caret-color: rgba(123, 222, 111, 255);
    color: rgba(123,222,111,0);
}";
        assert_eq!(extract_colors(css).len(), 4);
    }

    #[test]
    fn test_extracts_keyword_colors() {
        let css = r"
.selector {
    border-color: red;
    caret-color: blue;
    color: red;
}";
        assert_eq!(extract_colors(css).len(), 2);
    }
}
