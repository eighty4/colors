pub(crate) enum SourceType {
    LinkedCssFile { url: String },
    StyleTagCss { css: String },
}
