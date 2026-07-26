# UnicodeTeX
Convert LaTeX math into Unicode monospace graphics.

**Web App:** [https://jlpl.github.io/unicodetex](https://jlpl.github.io/unicodetex)

## Use Cases
Useful for rendering math in plain-text and monospace environments:
* Source code comments and documentation
* Terminal and console outputs
* Plain-text emails, commit messages, and log files
* Markdown notes and chat applications

## Supported Mathematical Notation
| Category | Commands & Syntax |
| :--- | :--- |
| Greek Letters | `\alpha`, `\beta`, `\gamma`, ... |
| Mathematical Operators | `\times`, `\partial`, `\approx`, ... |
| Commands | `\frac`, `\int`, `\sum`, `\prod`, `\min`, `\max`, `\lim`, `\abs`, `\matrix`, `\sqrt` |
| Delimiters | `()` |
| Subscripts & Superscripts | `_`, `^` |

**NOTE**: Monospace rendering may vary across devices.

## Examples
Input:
```text
e = \lim_{n \rightarrow \infty} (1 + \frac{1}{n})^n \approx 2.71828...
```

Output:
```text
                 n             
          ┌     ┐              
          │    1│              
e =  lim  │1 + ─│  ≈ 2.71828...
    n → ∞ │    n│              
          └     ┘
```

Input:
```text
R_z(\theta) = \matrix{{cos\theta,-sin\theta,0}{sin\theta,cos\theta,0}{0,0,1}}
```

Output:
```text
        ┌            ┐
        │cosθ -sinθ 0│
        │            │
R (θ) = │sinθ cosθ  0│
 z      │            │
        │ 0     0   1│
        └            ┘
```

## License
MIT License

