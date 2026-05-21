const LoadingSpinner = ({ fullPage = false }) => {
  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 300 }}>
        <div className="spinner" />
      </div>
    );
  }
  return <div className="spinner" />;
};

export default LoadingSpinner;
