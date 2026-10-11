export default function LoadingButton({ loading, children, variant, className = '', ...props }) {
  return (
    <button className={`btn ${variant || ''} ${className}`} disabled={loading || props.disabled} aria-busy={loading} {...props}>
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
