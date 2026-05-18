import { motion } from 'framer-motion';

const StatCard = ({ label, value, icon: Icon, color, delay = 0 }) => (
  <motion.div
    className="stat-card"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
  >
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span className="stat-card-label">{label}</span>
      {Icon && (
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 10,
          background: color ? `${color}18` : 'rgba(232,113,75,0.12)',
        }}>
          <Icon size={17} color={color || 'var(--color-primary)'} strokeWidth={2} />
        </span>
      )}
    </div>
    <div className="stat-card-value" style={color ? { color } : {}}>
      {value ?? 0}
    </div>
  </motion.div>
);

export default StatCard;
