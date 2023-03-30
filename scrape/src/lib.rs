use thiserror::*;

use crate::color::Color;
use crate::css::extract_colors;
use crate::html::search_html;
use crate::source::SourceType;

mod color;
mod css;
mod html;
mod source;

pub struct SiteColors {
    pub url: String,
    pub colors: Vec<Color>,
}

#[derive(Error, Debug)]
pub enum ColorScrapeError {
    #[error("error fetching document: {0}")]
    FetchDocumentError(#[from] reqwest::Error),
}

pub async fn scrape(url: String) -> Result<SiteColors, ColorScrapeError> {
    let result = reqwest::get(&url).await;
    let (_, response_body) = match result {
        Ok(response) => (response.status(), response.text().await),
        Err(err) => {
            return Err(ColorScrapeError::FetchDocumentError(err));
        }
    };

    let mut colors = Vec::new();
    let html = response_body.unwrap();
    for color_source in search_html(html.as_str()) {
        match color_source {
            SourceType::StyleTagCss { css } => {
                for color in extract_colors(css.as_str()) {
                    colors.push(color);
                }
            }
        }
    }

    Ok(SiteColors { url, colors })
}

#[cfg(test)]
mod tests {
    use std::sync::Once;

    use super::*;

    static INIT: Once = Once::new();

    fn run_web_server() {
        INIT.call_once(|| {
            tokio::spawn(warp::serve(warp::fs::dir("./examples/web/")).run(([127, 0, 0, 1], 5043)));
        });
    }

    fn url(filename: &str) -> String {
        format!("http://localhost:5043/{filename}")
    }

    #[tokio::test]
    async fn test() {
        run_web_server();
        let result = scrape(url("style-tag.html")).await;
        match result {
            Ok(colors) => {
                assert_eq!(2, colors.colors.len());
            }
            Err(err) => {
                println!("{err}");
                panic!();
            }
        }
    }
}
