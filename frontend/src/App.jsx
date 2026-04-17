import { useEffect, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [recipes, setRecipes] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    ingredients: "",
    steps: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [message, setMessage] = useState("");

  const fetchRecipes = async () => {
    try {
      setFetching(true);
      const response = await fetch(`${API_URL}/recipes`);
      const data = await response.json();
      setRecipes(data);
    } catch (error) {
      console.error("Error fetching recipes:", error);
      setMessage("Failed to load recipes");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!formData.title || !formData.ingredients || !formData.steps) {
      setMessage("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/recipes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || "Failed to create recipe");
        return;
      }

      setMessage("Recipe added successfully");
      setFormData({
        title: "",
        ingredients: "",
        steps: "",
      });

      fetchRecipes();
    } catch (error) {
      console.error("Error creating recipe:", error);
      setMessage("Something went wrong while adding the recipe");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1>RecipeHub</h1>
        <p className="subtitle">Add and view recipes from your microservices app</p>

        <div className="card">
          <h2>Add a New Recipe</h2>

          <form onSubmit={handleSubmit} className="recipe-form">
            <label>Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter recipe title"
              value={formData.title}
              onChange={handleChange}
            />

            <label>Ingredients</label>
            <textarea
              name="ingredients"
              placeholder="Enter ingredients"
              value={formData.ingredients}
              onChange={handleChange}
              rows="4"
            />

            <label>Steps</label>
            <textarea
              name="steps"
              placeholder="Enter cooking steps"
              value={formData.steps}
              onChange={handleChange}
              rows="5"
            />

            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Recipe"}
            </button>
          </form>

          {message && <p className="message">{message}</p>}
        </div>

        <div className="card">
          <div className="recipes-header">
            <h2>All Recipes</h2>
            <button onClick={fetchRecipes} className="refresh-btn">
              {fetching ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {recipes.length === 0 ? (
            <p>No recipes found</p>
          ) : (
            <div className="recipe-list">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="recipe-item">
                  <h3>{recipe.title}</h3>
                  <p>
                    <strong>Ingredients:</strong> {recipe.ingredients}
                  </p>
                  <p>
                    <strong>Steps:</strong> {recipe.steps}
                  </p>
                  <p className="timestamp">
                    Created: {new Date(recipe.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;