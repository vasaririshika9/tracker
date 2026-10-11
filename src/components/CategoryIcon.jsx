import {
  Utensils,
  Car,
  ShoppingBag,
  Film,
  GraduationCap,
  Receipt,
  HeartPulse,
  MoreHorizontal,
  Tag,
} from 'lucide-react';

const ICON_MAP = {
  Food: Utensils,
  Transport: Car,
  Shopping: ShoppingBag,
  Entertainment: Film,
  Education: GraduationCap,
  Bills: Receipt,
  Health: HeartPulse,
  Other: MoreHorizontal,
};

export default function CategoryIcon({ category, size = 16, color }) {
  const IconComponent = ICON_MAP[category] || Tag;
  return <IconComponent size={size} color={color} />;
}
