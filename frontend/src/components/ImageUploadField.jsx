import PropTypes from "prop-types";

/**
 * -------------------------------------------------------------
 * ImageUploadField
 * -------------------------------------------------------------
 * Eingabefeld für ein Rezeptbild mit Vorschau.
 * -------------------------------------------------------------
 */
export default function ImageUploadField({
    label = "Rezeptbild hochladen",
    imageFile = null,
    previewUrl = "",
    title = "",
    onChange,
    disabled = false,
}) {
    return (
        <div className="form-label">
            <span>{label}</span>

            <input
                type="file"
                accept="image/*"
                onChange={onChange}
                disabled={disabled}
            />

            {(previewUrl || imageFile) ? (
                <div className="image-preview-block">
                    <p className="image-preview-title">Vorschau</p>

                    {previewUrl ? (
                        <img
                            src={previewUrl}
                            alt={title ? `Vorschau für ${title}` : "Bildvorschau"}
                            className="image-preview"
                        />
                    ) : null}

                    {imageFile ? (
                        <p className="image-file-name">Datei: {imageFile.name}</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

ImageUploadField.propTypes = {
    label: PropTypes.string,
    imageFile: PropTypes.shape({
        name: PropTypes.string,
    }),
    previewUrl: PropTypes.string,
    title: PropTypes.string,
    onChange: PropTypes.func.isRequired,
    disabled: PropTypes.bool,
};