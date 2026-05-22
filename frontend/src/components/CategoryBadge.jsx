import PropTypes from "prop-types";

export default function CategoryBadge({ label, color, onClick }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={`Nach Kategorie filtern: ${label}`}
            style={{
                background: color || "#888",
                color: "#fff",
                padding: "4px 10px",
                borderRadius: 999,
                border: "none",
                fontSize: "0.75rem",
                lineHeight: 1.6,
                cursor: "pointer",
            }}
        >
            {label}
        </button>
    );
}

CategoryBadge.propTypes = {
    label: PropTypes.string.isRequired,
    color: PropTypes.string,
    onClick: PropTypes.func.isRequired,
};