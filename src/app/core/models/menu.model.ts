export type FoodType = 'VEG' | 'NON_VEG' | 'EGG';

export type MenuCategoryType =
  | 'STARTERS' | 'MAINS' | 'BREADS' | 'RICE_BIRYANI'
  | 'DESSERTS' | 'DRINKS' | 'MOCKTAILS' | 'JUICES' | 'COMBOS' | 'CUSTOM';

export interface MenuCategory {
  id: number;
  name: string;
  categoryType: MenuCategoryType;
  displayOrder: number;
  active: boolean;
  itemCount?: number;
}

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  foodType: FoodType;
  categoryId: number;
  categoryName?: string;
  imageUrl?: string;
  available: boolean;
  displayOrder: number;
  preparationTimeMinutes?: number;
  tags?: string[];
}

export interface MenuItemRequest {
  name: string;
  description?: string;
  price: number;
  foodType: FoodType;
  categoryId: number;
  available: boolean;
  displayOrder?: number;
  preparationTimeMinutes?: number;
  tags?: string[];
}
