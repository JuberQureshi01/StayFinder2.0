import {
  Flame,
  Tent,
  Palmtree,
  Castle,
  Mountain,
  Coffee,
  Waves,
  Snowflake,
} from "lucide-react";

const categories = [
  { label: "Trending", icon: Flame },
  { label: "Heritage", icon: Castle },
  { label: "Amazing Pools", icon: Waves },
  { label: "Camping", icon: Tent },
  { label: "Tropical", icon: Palmtree },
  { label: "Mountains", icon: Mountain },
  { label: "Bed & Breakfast", icon: Coffee },
  { label: "Arctic", icon: Snowflake },
];

interface CategoriesProps {
  selectedCategory: string;
  onSelect: (category: string) => void;
}

const Categories = ({ selectedCategory, onSelect }: CategoriesProps) => {
  return (
    <div className="overflow-x-auto pt-6 pb-2 [&::-webkit-scrollbar]:hidden -mx-4 sm:mx-0 px-4 sm:px-0">
      <div className="flex gap-6 sm:gap-8">
        {categories.map((category) => {
          const isSelected = selectedCategory === category.label;
          return (
            <div
              key={category.label}
              onClick={() => onSelect(category.label)}
              className={`flex min-w-max cursor-pointer flex-col items-center gap-2 transition-all duration-200 border-b-2 pb-2
                ${
                  isSelected
                    ? "border-gray-900 text-gray-900"
                    : "border-transparent text-gray-400 hover:border-gray-300 hover:text-gray-600"
                }`}
            >
              <category.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{category.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
