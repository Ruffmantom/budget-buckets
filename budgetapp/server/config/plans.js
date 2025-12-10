class BudgetPlan {
    constructor(
        planTitle = "",
        allowedBudgets = 0,
        allowedLinkedUsers = 0,
        maxLinkedBudgets = 0

    ) {
        this.planTitle = planTitle
        this.allowedBudgets = allowedBudgets // N number of budgets for the user
        this.allowedLinkedUsers = allowedLinkedUsers // Allows up to N users to be linked to a single budget
        this.maxLinkedBudgets = maxLinkedBudgets // Allows the user to be linked to N number of budgets.
    }
}


const basicPlan = new BudgetPlan("Basic", 1, 2, 1);
const advancedPlan = new BudgetPlan("Advanced", 2, 2, 10);

export const budgetPlans = [
    basicPlan,
    advancedPlan
]