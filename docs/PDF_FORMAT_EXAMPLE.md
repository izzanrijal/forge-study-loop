
# Example Study Material Format for RecallForge

This document shows the recommended format for PDFs that will be uploaded to RecallForge. Following this structure ensures optimal AI chunking and question generation.

---

## Learning Objectives

| ID | Learning Objective | Priority | Page Range | Tags |
|----|-------------------|----------|------------|------|
| LO-001 | Understand React Hooks fundamentals and their lifecycle | High | 1-5 | react, hooks, javascript |
| LO-002 | Master useState and useEffect patterns | High | 6-12 | react, state, effects |
| LO-003 | Implement custom hooks for reusable logic | Medium | 13-18 | react, custom-hooks, patterns |
| LO-004 | Handle side effects with useEffect cleanup | Medium | 19-23 | react, cleanup, memory |
| LO-005 | Optimize performance with useMemo and useCallback | Low | 24-28 | react, performance, optimization |

---

## Chapter 1: React Hooks Fundamentals (Pages 1-5)

### What are React Hooks?

React Hooks are functions that let you "hook into" React state and lifecycle features from function components. They were introduced in React 16.8 and allow you to use state and other React features without writing a class component.

#### Key Principles:
- Hooks can only be called at the top level of React functions
- Don't call Hooks inside loops, conditions, or nested functions
- Always use Hooks in the same order every time the component renders

#### Basic Hook Rules:
1. **Only call Hooks at the top level** - Never call Hooks inside loops, conditions, or nested functions
2. **Only call Hooks from React functions** - Call them from React function components or custom Hooks

### Why Use Hooks?

Hooks solve several problems:
- **Stateful logic reuse**: Share stateful logic between components without wrapper hell
- **Complex components**: Break down complex components into smaller functions
- **Classes confusion**: Eliminate confusion around `this` binding and lifecycle methods

---

## Chapter 2: useState and useEffect Patterns (Pages 6-12)

### useState Hook

The `useState` Hook lets you add state to function components. It returns an array with two elements: the current state value and a function to update it.

```javascript
const [count, setCount] = useState(0);
```

#### useState Best Practices:
- Initialize state with the correct data type
- Use functional updates for dependent state changes
- Don't mutate state directly, always use the setter function

### useEffect Hook

The `useEffect` Hook lets you perform side effects in function components. It serves the same purpose as `componentDidMount`, `componentDidUpdate`, and `componentWillUnmount` combined.

```javascript
useEffect(() => {
  document.title = `Count: ${count}`;
}, [count]);
```

#### useEffect Patterns:
- **Effect without cleanup**: For data fetching, manual DOM changes
- **Effect with cleanup**: For subscriptions, timers, event listeners
- **Conditional effects**: Using dependency arrays to control when effects run

---

## Chapter 3: Custom Hooks Implementation (Pages 13-18)

### Creating Custom Hooks

Custom Hooks are JavaScript functions whose names start with "use" and that may call other Hooks. They let you extract component logic into reusable functions.

#### Example: useCounter Hook
```javascript
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}
```

### Custom Hook Benefits:
- **Reusability**: Share logic between multiple components
- **Separation of concerns**: Extract complex logic from components
- **Testability**: Test hooks independently from components

---

## Chapter 4: Effect Cleanup and Memory Management (Pages 19-23)

### Understanding Cleanup

When your effect returns a function, React will run it when it's time to clean up. This prevents memory leaks and unwanted behavior.

#### Common Cleanup Scenarios:
- **Subscriptions**: Unsubscribe from external data sources
- **Timers**: Clear intervals and timeouts
- **Event listeners**: Remove DOM event listeners

#### Example: Cleanup Pattern
```javascript
useEffect(() => {
  const subscription = subscribeTo(something);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);
```

### Memory Leak Prevention:
- Always clean up subscriptions and event listeners
- Clear timers and intervals in cleanup functions
- Cancel pending API requests when component unmounts

---

## Chapter 5: Performance Optimization (Pages 24-28)

### useMemo Hook

`useMemo` lets you cache the result of a calculation between re-renders. Use it for expensive calculations that don't need to run on every render.

```javascript
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);
```

### useCallback Hook

`useCallback` lets you cache a function definition between re-renders. This is useful when passing callbacks to optimized child components.

```javascript
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

#### Performance Tips:
- Don't overuse `useMemo` and `useCallback` - they have their own overhead
- Profile your app to identify actual performance bottlenecks
- Consider React.memo for component-level optimization

---

## Summary

React Hooks provide a powerful way to use state and lifecycle features in function components. Key takeaways:

1. Follow the Rules of Hooks consistently
2. Use useState for component state management
3. Use useEffect for side effects and lifecycle logic
4. Create custom Hooks for reusable stateful logic
5. Always clean up effects to prevent memory leaks
6. Use performance hooks judiciously based on actual needs

**Important**: This format with clear Learning Objectives table and structured content enables RecallForge to automatically generate targeted questions and track your mastery progress effectively.
