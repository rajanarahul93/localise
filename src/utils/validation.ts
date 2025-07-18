export const validatePostTitle = (title: string): string | null => {
  if (!title.trim()) return "Title is required";
  if (title.length < 3) return "Title must be at least 3 characters";
  if (title.length > 100) return "Title must be less than 100 characters";
  return null;
};

export const validatePostDescription = (description: string): string | null => {
  if (!description.trim()) return "Description is required";
  if (description.length < 10)
    return "Description must be at least 10 characters";
  if (description.length > 500)
    return "Description must be less than 500 characters";
  return null;
};

export const validatePostCategory = (category: string): string | null => {
  const validCategories = ["events", "for-sale", "help", "recommendations"];
  if (!category) return "Please select a category";
  if (!validCategories.includes(category))
    return "Please select a valid category";
  return null;
};