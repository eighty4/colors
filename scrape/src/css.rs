use std::collections::{HashMap, HashSet};

use css_color::Srgb;
use lazy_static::lazy_static;
use regex::Regex;

use crate::Color;

mod keyword;

lazy_static! {
    static ref COLOR_KEYWORDS: HashMap<&'static str, &'static str> = keyword::colors();
    static ref KEYWORD_REGEX: Regex = Regex::new(
        format!(r":[\s\n]*(?P<keyword>{})[\s\n]*;", COLOR_KEYWORDS
            .keys()
            .map(|s| &**s)
            .collect::<Vec<_>>()
            .join("|")
            .as_str())
        .as_str()
    )
    .unwrap();
    static ref SRGB_REGEX: Regex = Regex::new(
        // /-- two patterns handling sRGB color space fns and hexidecimal notation
        // | /-- fn names hsl, hsla, hwb, rgb and rgba
        // | |                    /-- matches fn parameters, 5 or more of:
        // | |                    |        whitespace, newlines,
        // | |                    |        numbers, commas,
        // | |                    |        percents and decimals
        // | |                    |                  /-- matches 3, 4, 6 or 8 digit hex colors
        r"(?:hsla?|rgba?|hwb)\([\s\d%/.,\n]{5,}\)|#[\da-fA-F]{3}(?:[\da-fA-F]{3,5}|[\da-fA-F])?"
    )
    .unwrap();
}

impl From<Srgb> for Color {
    fn from(v: Srgb) -> Self {
        Color::rgba(
            (v.red * 255.) as u8,
            (v.green * 255.) as u8,
            (v.blue * 255.) as u8,
            (v.alpha * 255.) as u8,
        )
    }
}

#[allow(dead_code)]
pub(crate) fn extract_colors(css: &'static str) -> HashSet<Color> {
    let mut colors = HashSet::new();
    for srgb_match in SRGB_REGEX.find_iter(css) {
        if let Ok(srgb) = srgb_match.as_str().parse::<Srgb>() {
            colors.insert(Color::from(srgb));
        }
    }
    for keyword_captures in KEYWORD_REGEX.captures_iter(css) {
        colors.insert(parse_keyword_str(
            keyword_captures.name("keyword").unwrap().as_str(),
        ));
    }
    colors
}

fn parse_hex_rgb_str(hex_rgb: &str) -> Color {
    match hex_rgb.len() {
        3 => Color::rgb(
            parse_hex_shorthand(&hex_rgb[0..1]),
            parse_hex_shorthand(&hex_rgb[1..2]),
            parse_hex_shorthand(&hex_rgb[2..3]),
        ),
        4 => Color::rgba(
            parse_hex_shorthand(&hex_rgb[0..1]),
            parse_hex_shorthand(&hex_rgb[1..2]),
            parse_hex_shorthand(&hex_rgb[2..3]),
            parse_hex_shorthand(&hex_rgb[3..4]),
        ),
        6 => Color::rgb(
            parse_hex(&hex_rgb[0..2]),
            parse_hex(&hex_rgb[2..4]),
            parse_hex(&hex_rgb[4..6]),
        ),
        8 => Color::rgba(
            parse_hex(&hex_rgb[0..2]),
            parse_hex(&hex_rgb[2..4]),
            parse_hex(&hex_rgb[4..6]),
            parse_hex(&hex_rgb[6..8]),
        ),
        _ => panic!(),
    }
}

fn parse_hex(hex: &str) -> u8 {
    u8::from_str_radix(hex, 16).unwrap()
}

fn parse_hex_shorthand(hex: &str) -> u8 {
    parse_hex(hex) * 17
}

fn parse_keyword_str(keyword: &str) -> Color {
    parse_hex_rgb_str(COLOR_KEYWORDS.get(keyword).unwrap())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_css(css: &'static str, expected: Color) {
        let result = extract_colors(css);
        assert!(!result.is_empty());
        assert_eq!(result.into_iter().next().unwrap(), expected);
    }

    #[test]
    fn test_extracts_hex_colors() {
        test_css("#000", Color::rgb(0, 0, 0));
        test_css("#fff", Color::rgb(255, 255, 255));
        test_css("#f0ff", Color::rgb(255, 0, 255));
        test_css("#ffffff", Color::rgb(255, 255, 255));
        test_css("#000000ee", Color::rgba(0, 0, 0, 238));
    }

    #[test]
    fn test_extracts_rgb_colors() {
        test_css("rgb(12, 45, 78)", Color::rgb(12, 45, 78));
        test_css("rgb(12, 45, 78, 255)", Color::rgb(12, 45, 78));
        test_css("rgb(123,45,78)", Color::rgba(123, 45, 78, 255));
        test_css("rgba(23, 22, 11, 255)", Color::rgb(23, 22, 11));
        test_css("rgba(123,222,111,0)", Color::rgba(123, 222, 111, 0));
        test_css("rgb(1 2 3)", Color::rgba(1, 2, 3, 255));
        test_css("rgb(4    5   6)", Color::rgb(4, 5, 6));
        test_css("rgba(7 8 9 / 1)", Color::rgb(7, 8, 9));
        test_css("rgba(10 11 12 / 0)", Color::rgba(10, 11, 12, 0));
        test_css("rgb(9 8 7 / .5)", Color::rgba(9, 8, 7, 127));
        test_css("rgb(6 5 4 / 50%)", Color::rgba(6, 5, 4, 127));
        test_css("rgb(1% 11% 100% / .5)", Color::rgba(2, 28, 255, 127));
        test_css("rgb(2% 22% 100% / 50%)", Color::rgba(5, 56, 255, 127));
    }

    #[test]
    fn test_extracts_hsl_colors() {
        test_css("hsl(360 100% 50%)", Color::rgb(255, 0, 0));
        test_css("hsl(150 70% 20% / .5)", Color::rgba(15, 86, 51, 127));
        test_css("hsl(360, 100%, 50%, .5)", Color::rgba(255, 0, 0, 127));
        test_css("hsla(360 100% 50% / .5)", Color::rgba(255, 0, 0, 127));
        test_css("hsla(360, 100%, 50%, .5)", Color::rgba(255, 0, 0, 127));
        test_css("hsla(360, 100%, 50%, .5)", Color::rgba(255, 0, 0, 127));
    }

    #[test]
    fn test_extracts_hwb_colors() {
        test_css("hwb(194 0% 0%)", Color::rgb(0, 195, 255));
        test_css("hwb(194 0% 0% / .5)", Color::rgba(0, 195, 255, 127));
    }

    #[test]
    fn test_extracts_keyword_colors() {
        test_css(":green;", Color::rgb(0, 128, 0));
    }
}
