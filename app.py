from flask import Flask, render_template, request, jsonify
import sympy as sp
import numpy as np

app = Flask(__name__)

def smart_parse(s):
    if '/' in s and '(' not in s:
        p = s.split('/')
        return f"({p[0]})/({p[1]})"
    return s

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    try:
        data = request.get_json()
        raw_f = data.get('function')
        a = float(data.get('lower'))
        b = float(data.get('upper'))
        p = int(data.get('precision'))

        x = sp.symbols('x')
        expr = sp.sympify(smart_parse(raw_f).replace('^', '**'))

        h = (b - a) / 4
        xv = [a + i*h for i in range(5)]
        fv = [float(expr.subs(x, val).evalf()) for val in xv]
        
        # Boole's Weights: 7, 32, 12, 32, 7
        w = [7, 32, 12, 32, 7]
        prods = [round(w[i]*fv[i], p) for i in range(5)]
        bracket_sum = sum(prods)
        res = (2 * h / 45) * bracket_sum

        return jsonify({
            "success": True,
            "steps": {
                "interpreted": smart_parse(raw_f),
                "h_step": f"h = \\frac{{{b}-{a}}}{{4}} = {h}",
                "table": [{"i": i, "x": round(xv[i], 4), "fx": round(fv[i], p)} for i in range(5)],
                "s1": f"I \\approx \\frac{{2({h})}}{{45}} [7({round(fv[0],p)}) + 32({round(fv[1],p)}) + 12({round(fv[2],p)}) + 32({round(fv[3],p)}) + 7({round(fv[4],p)})]",
                "s2": f"I \\approx {round(2*h/45, 6)} [{prods[0]} + {prods[1]} + {prods[2]} + {prods[3]} + {prods[4]}]",
                "result": round(res, p)
            },
            "graph": {
                "x": np.linspace(a, b, 50).tolist(),
                "y": [float(expr.subs(x, v).evalf()) for v in np.linspace(a, b, 50)]
            }
        })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

if __name__ == '__main__':
    app.run(debug=True)