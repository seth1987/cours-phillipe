import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

const RDM_TYPES = [
  {
    id: 'traction',
    name: 'Traction simple',
    description: 'Sollicitation où une barre est soumise à des forces axiales de sens opposés tendant à l\'allonger.',
    formulas: ['σ = F / S', 'ε = ΔL / L', 'E = σ / ε'],
    variables: ['F (Force)', 'S (Section)', 'L (Longueur)', 'E (Module de Young)'],
  },
  {
    id: 'compression',
    name: 'Compression',
    description: 'Sollicitation où une barre est soumise à des forces axiales tendant à la raccourcir.',
    formulas: ['σ = F / S', 'ε = ΔL / L', 'Flambement: Fc = π²EI / L²'],
    variables: ['F (Force)', 'S (Section)', 'I (Moment d\'inertie)', 'L (Longueur)'],
  },
  {
    id: 'flexion',
    name: 'Flexion simple',
    description: 'Sollicitation où une poutre est soumise à des moments fléchissants.',
    formulas: ['σmax = M × ymax / I', 'f = PL³ / (48EI)', 'M = P × L / 4'],
    variables: ['M (Moment)', 'P (Charge)', 'L (Portée)', 'I (Inertie)', 'y (Distance)'],
  },
  {
    id: 'torsion',
    name: 'Torsion',
    description: 'Sollicitation où un arbre est soumis à des couples de torsion.',
    formulas: ['τmax = Mt × r / Ip', 'θ = Mt × L / (G × Ip)', 'Ip = π × d⁴ / 32'],
    variables: ['Mt (Moment de torsion)', 'r (Rayon)', 'G (Module de cisaillement)', 'Ip (Moment polaire)'],
  },
  {
    id: 'cisaillement',
    name: 'Cisaillement',
    description: 'Sollicitation où un élément est soumis à des forces tangentielles.',
    formulas: ['τ = V / S', 'τmax = V × Q / (I × b)'],
    variables: ['V (Effort tranchant)', 'S (Section)', 'Q (Moment statique)', 'b (Largeur)'],
  },
];

export default async function TypesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Types RDM</h1>
        <p className="text-muted-foreground">
          Référence des types de sollicitation en Résistance des Matériaux
        </p>
      </div>

      <div className="grid gap-6">
        {RDM_TYPES.map((type) => (
          <Card key={type.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <BookOpen className="h-5 w-5 text-primary" />
                <CardTitle>{type.name}</CardTitle>
              </div>
              <CardDescription>{type.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Formules principales</h4>
                  <div className="space-y-1">
                    {type.formulas.map((formula, index) => (
                      <code
                        key={index}
                        className="block text-sm bg-muted px-2 py-1 rounded"
                      >
                        {formula}
                      </code>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Variables</h4>
                  <div className="flex flex-wrap gap-2">
                    {type.variables.map((variable, index) => (
                      <Badge key={index} variant="secondary">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
