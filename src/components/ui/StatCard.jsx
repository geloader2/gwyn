import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon: Icon, color, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl p-6 shadow-sm border border-lavender-100 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-sm text-lavender-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-slate-800">{value}</p>
    </motion.div>
  );
};

export default StatCard;