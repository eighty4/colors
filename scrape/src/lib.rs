use thiserror::*;

use crate::color::Color;

mod color;

pub struct SiteColors {
    pub url: String,
    pub colors: Vec<Color>,
}

#[derive(Error, Debug)]
pub enum ColorScrapeError {}

pub async fn scrape(url: String) -> Result<SiteColors, ColorScrapeError> {
    Ok(SiteColors {
        url,
        colors: Vec::new(),
    })
}
