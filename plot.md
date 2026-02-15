---
kernelspec:
  name: python3
  display_name: 'Python 3'
---

# Plot

```{code-cell} python
:tags: [hide-input]
import matplotlib.pyplot as plt
import numpy as np

x = np.linspace(0, 10, 100)
y = np.sin(x)

plt.figure()
plt.plot(x, y)
plt.title('Sine Wave')
plt.xlabel('x') 
plt.ylabel('sin(x)')
plt.show()
```

````{exercise} some title
:label: exercise
```{code-cell} python
# Your code here
```
````