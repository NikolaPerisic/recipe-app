import Search from "./models/Search";
import Recipe from "./models/Recipe";
import List from "./models/List";
import Likes from "./models/Likes";
import * as searchView from "./views/searchView";
import * as recipeView from "./views/recipeView";
import * as listView from "./views/listView";
import * as likesView from "./views/likesView";
import { elements, renderLoader, clearLoader } from "./views/base";
/** Global App State
 * Search object
 * Current recipe obj
 * Shopping list obj
 * Liked recipes
 */
const state = {};

/**
 * Search controller
 */

const controlSearch = async () => {
	// Get query from view
	const query = searchView.getInput();
	//new search object and add to state
	if (query) {
		state.search = new Search(query);
		// Prepare UI for results TODO
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);
		try {
			//Search for recipes
			await state.search.getResults();

			// Render results on UI
			clearLoader();
			searchView.renderResults(state.search.recipes);
		} catch (error) {
			console.log(error);
			alert(`Error loading results...`);
			clearLoader();
		}
	}
};

elements.searchForm.addEventListener("submit", e => {
	e.preventDefault();
	controlSearch();
});

elements.searchResPages.addEventListener("click", e => {
	const btn = e.target.closest(".btn-inline");
	if (btn) {
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.recipes, goToPage);
	}
});

/**
 * Recipe controller
 */
const controlRecipe = async () => {
	// get id from url
	const id = window.location.hash.replace("#", "");
	if (id) {
		//prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);
		// highlight selected search item
		if (state.search) {
			searchView.highlightSelected(id);
		}
		// create recipe obj
		state.recipe = new Recipe(id);
		try {
			// get recipe data and parse Ingredients
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();
			// calc servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();
			// render recipe
			clearLoader();
			recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
		} catch (error) {
			console.log(error);
			alert(`Error loading recipe...`);
		}
	}
};
["hashchange", "load"].forEach(event =>
	window.addEventListener(event, controlRecipe)
);

/**
 * List controller
 */
const controlList = () => {
	// create a new list if there is no list
	if (!state.list) {
		state.list = new List();
	}
	// add ingredient to the list and UI
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
};

// handle delete and update list item events
elements.shopping.addEventListener("click", e => {
	const id = e.target.closest(".shopping__item").dataset.itemid;
	//handle delete btn
	if (e.target.matches(".shopping__delete, .shopping__delete *")) {
		// delete from state
		state.list.deleteItem(id);
		//delete from UI
		listView.deleteItem(id);
	} else if (e.target.matches(".shopping__count-value")) {
		// handle the count update
		if (e.target.value > 0) {
			const val = parseFloat(e.target.value, 10);
			state.list.updateCount(id, val);
		}
	}
});

/**
 * Likes controller
 */

const controlLike = () => {
	if (!state.likes) {
		state.likes = new Likes();
	}
	const currentID = state.recipe.id;
	// user has not yet liked current recipe
	if (!state.likes.isLiked(currentID)) {
		// add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
		);

		// toggle the like btn
		likesView.toggleLikeBtn(true);
		// add like to UI list
		likesView.renderLike(newLike);
		// user has liked current recipe
	} else {
		// remove like from the state
		state.likes.deleteLike(currentID);
		// toggle like btn
		likesView.toggleLikeBtn(false);
		//remove like from UI
		likesView.deleteLike(currentID);
	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
};
//Restore liked recepies on page load
window.addEventListener("load", () => {
	state.likes = new Likes();
	//restore likes
	state.likes.readStorage();
	//toggle like menu btn
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	// render existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

// Handling recipe button clicks
elements.recipe.addEventListener("click", e => {
	if (e.target.matches(".btn-decrease, .btn-decrease *")) {
		//decrease btn is clicked
		if (state.recipe.servings > 1) {
			state.recipe.updateServings("dec");
			recipeView.updateServingsIngredients(state.recipe);
		}
	} else if (e.target.matches(".btn-increase, .btn-increase *")) {
		// increase btn clicked
		state.recipe.updateServings("inc");
		recipeView.updateServingsIngredients(state.recipe);
	} else if (e.target.matches(".recipe__btn--add, .recipe__btn--add *")) {
		// add ingredients to shopping list
		controlList();
	} else if (e.target.matches(".recipe__love, .recipe__love *")) {
		//like controller
		controlLike();
	}
});
// focus into selected recipe
elements.searchResList.addEventListener("click", e => {
	const link = e.target.closest(".results__link");
	if (link) {
		let focus = document.querySelector(".recipe__ingredients");
		focus.scrollIntoView();
	}
});
