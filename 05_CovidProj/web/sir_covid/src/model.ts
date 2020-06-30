type edge = { u: number; v: number; population_moving: number };
type state = { susceptible: number; infected: number; recovered: number };

class model {
  recovery_rate: number; //recover rate
  transmission_rate: number; //rate transmission
  n_u: number; //portion of moved susceptible individuals from u to neighbours

  population_max: number;
  h_max: number;
  nodes_id: Array<number>;
  state_of: { [key: number]: state } = {};
  population_of: { [key: number]: number } = {};
  neighbors: Array<Array<[number, number]>>;

  constructor(
    recovery_rate: number,
    transmission_rate: number,
    n_u: number,
    edges: Array<edge>,
    states: Array<[number, state]>,
    population_of: { [key: number]: number }
  ) {
    this.recovery_rate = recovery_rate;
    this.transmission_rate = transmission_rate;
    this.n_u = n_u;

    this.neighbors = [];
    this.nodes_id = Array.from(new Set(edges.map(({ u, v }) => [u, v]).flat()));

    edges.forEach(({ u, v, population_moving }) => {
      this.neighbors[u].push([v, population_moving]);
      this.neighbors[v].push([u, population_moving]);
    });

    states.forEach(([node_id, state]) => (this.state_of[node_id] = state));

    this.population_of = population_of;
    this.population_max = Math.max(...Object.values(population_of));
    this.h_max = Math.max(
      ...Object.values(edges.map((edge) => edge.population_moving))
    );
  }

  fI(u: number) {
    const { infected, susceptible } = this.state_of[u];
    let s1 = 0.0,
      s2 = 0.0;

    this.neighbors[u].forEach(([node, population_moving]) => {
      s1 +=
        (this.population_of[node] / this.population_max) *
        (population_moving / this.h_max) *
        this.state_of[node].infected;
      s2 +=
        (1.0 - population_moving / this.h_max) *
        this.n_u *
        this.state_of[node].infected; //replace n_u with n_uv
    });

    return (
      (1.0 - this.recovery_rate) * infected +
      this.transmission_rate * (1.0 - this.n_u) * susceptible * infected +
      this.transmission_rate * (1.0 - this.n_u) * susceptible * s1 +
      this.transmission_rate * susceptible * s2
    );
  }

  fS(u: number) {
    const { infected, susceptible } = this.state_of[u];
    let s1 = 0.0,
      s2 = 0.0;

    this.neighbors[u].forEach(([node, population_moving]) => {
      s1 +=
        (this.population_of[node] / this.population_max) *
        (population_moving / this.h_max) *
        this.state_of[node].infected;
      s2 +=
        (1.0 - population_moving / this.h_max) *
        this.n_u *
        this.state_of[node].infected; //replace n_u with n_uv
    });

    return (
      susceptible -
      this.transmission_rate * (1.0 - this.n_u) * susceptible * infected -
      this.transmission_rate * (1.0 - this.n_u) * susceptible * s1 -
      this.transmission_rate * susceptible * s2
    );
  }

  fR(u: number) {
    const { infected, recovered } = this.state_of[u];
    return recovered + this.recovery_rate * infected;
  }

  step() {
    const new_state: { [key: number]: state } = {};
    this.nodes_id.forEach((node) => {
      new_state[node] = {
        susceptible: this.fS(node),
        infected: this.fI(node),
        recovered: this.fR(node),
      }; //fR equiv S[v].R + r * S[v].I
    });

    this.state_of = new_state;
  }
}


// ================== testing ===================
let edges = [];
for(let i = 0; i < 6; i++) {
  for(let j = i + 1; j < 6; j++) {
    console.log(i+ " "+ j);
    edges.push({u:i, v:j, population_moving:1});
  }
}

let states: Array<[number, state]> = [[0,{susceptible:0.8, infected:0.2, recovered:0}]];
for(let i = 1; i < 6; i++) {
  states.push([i, {susceptible:1, infected: 0, recovered: 0}]);
}

let population = <any>{}; 
for(let i = 0; i < 6; i++) {
  population[i] = 100;
}

const m = new model(0.6, 0.5, 0.25, edges, states, population);
for(let t = 0; t < 10; t++) {
  m.step();
}

console.log(m.state_of);

export default model;
