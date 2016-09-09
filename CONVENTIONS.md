# CONVENTIONS  
===========  
  
## Error handling  
-----------------  
  
### 1.1 Error handling in controllers  
  
Each controller should return promise object. In the end of promises chain, you need to place `catch` statement that looks like:
```
.catch((err) => { return next(err instanceof Error ? err : new VError(err)); });
```