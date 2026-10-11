import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { CATEGORIES, formatINR } from '../services/expenseService';
import CategoryIcon from './CategoryIcon';

const CATEGORY_COLOR_MAP = CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat.color;
  return acc;
}, {});

export default function ExpensePieChart({ expenses }) {
  // Aggregate expenses by category
  const { chartData, totalAmount } = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const groups = {};

    expenses.forEach((item) => {
      const cat = item.category || 'Other';
      groups[cat] = (groups[cat] || 0) + (Number(item.amount) || 0);
    });

    const data = Object.keys(groups)
      .map((catKey) => {
        const catObj = CATEGORIES.find((c) => c.id === catKey) || {
          id: catKey,
          label: catKey,
          color: '#887680',
        };
        const amount = groups[catKey];
        const percentage = total > 0 ? ((amount / total) * 100).toFixed(1) : 0;
        return {
          name: catObj.label || catKey,
          categoryId: catKey,
          value: amount,
          percentage: Number(percentage),
          color: catObj.color || CATEGORY_COLOR_MAP[catKey] || '#E98DB5',
        };
      })
      .sort((a, b) => b.value - a.value);

    return { chartData: data, totalAmount: total };
  }, [expenses]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-dot" style={{ backgroundColor: d.color }} />
            <span className="tooltip-cat">{d.name}</span>
          </div>
          <div className="tooltip-amount">{formatINR(d.value)}</div>
          <div className="tooltip-pct">{d.percentage}% of total spending</div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-card">
      <div className="card-subhead">
        <h2>Category Distribution</h2>
        <span className="badge-count">
          {chartData.length} {chartData.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {expenses.length === 0 || totalAmount === 0 ? (
        <div className="empty-chart-state">
          <div className="empty-doughnut-ring" aria-hidden="true">
            <span>₹0</span>
          </div>
          <p className="empty-chart-title">No spending data yet</p>
          <p className="empty-chart-desc">
            Add your first expense on the left to see category breakdown.
          </p>
        </div>
      ) : (
        <>
          <div className="chart-visual-wrapper">
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={68}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={600}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Centered Total inside Doughnut */}
            <div className="doughnut-center-info" aria-hidden="true">
              <span className="center-label">Total Spent</span>
              <strong className="center-value">{formatINR(totalAmount)}</strong>
              <span className="center-sub">{expenses.length} txns</span>
            </div>
          </div>

          {/* Interactive Legend with Amounts and Percentages */}
          <div className="chart-legend-list">
            {chartData.map((item) => (
              <div key={item.categoryId} className="legend-item">
                <div className="legend-left">
                  <span className="legend-color-tag" style={{ backgroundColor: item.color }}>
                    <CategoryIcon category={item.categoryId} size={13} color="#ffffff" />
                  </span>
                  <span className="legend-name">{item.name}</span>
                </div>
                <div className="legend-right">
                  <span className="legend-amount">{formatINR(item.value)}</span>
                  <span className="legend-percent">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
