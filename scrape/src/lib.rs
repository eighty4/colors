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
    #[error("bad http response for doc")]
    BadDocumentResponse(),
}

pub async fn scrape(url: String) -> Result<SiteColors, ColorScrapeError> {
    let mut colors = Vec::new();
    let html = fetch(&url).await?;
    for color_source in search_html(&url, html.as_str()) {
        match color_source {
            SourceType::StyleTagCss { css } => {
                for color in extract_colors(css.as_str()) {
                    colors.push(color);
                }
            }
            SourceType::LinkedCssFile { url } => {
                for color in extract_colors(fetch(&url).await?.as_str()) {
                    colors.push(color);
                }
            }
        }
    }

    Ok(SiteColors { url, colors })
}

async fn fetch(url: &String) -> Result<String, ColorScrapeError> {
    let result = reqwest::get(url).await;
    let response = match result {
        Ok(response) => response,
        Err(err) => {
            return Err(ColorScrapeError::FetchDocumentError(err));
        }
    };
    let status_code = response.status().as_u16();
    if !(200..300).contains(&status_code) {
        return Err(ColorScrapeError::BadDocumentResponse());
    }
    let response_body = match response.text().await {
        Ok(response_body) => response_body,
        Err(err) => return Err(ColorScrapeError::FetchDocumentError(err)),
    };
    Ok(response_body)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn run_web_server(port: u16) -> impl Fn(&str) -> String {
        tokio::spawn(warp::serve(warp::fs::dir("./examples/web/")).run(([127, 0, 0, 1], port)));
        move |filename: &str| format!("http://localhost:{port}/{filename}")
    }

    #[tokio::test]
    async fn test_style_tag_css() {
        let url = run_web_server(5100);
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

    #[tokio::test]
    async fn test_linked_css() {
        let url = run_web_server(5101);
        let result = scrape(url("linked-css.html")).await;
        match result {
            Ok(colors) => {
                assert_eq!(3, colors.colors.len());
            }
            Err(err) => {
                println!("{err}");
                panic!();
            }
        }
    }
}
