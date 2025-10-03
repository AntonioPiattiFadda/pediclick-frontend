import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import TableSkl from "../sellPoints/ui/tableSkl";
import { TeamMemberTable } from "./TeamMemberTable";
import { AddTeamMemberBtn } from "./AddTeamMemberBtn";
import { getUserTeamMembers } from "@/service/profiles";

export const TeamMemberContainer = () => {
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedCategory, setSelectedCategory] = useState("all");
  // const [selectedStatus, setSelectedStatus] = useState("all");

  const {
    data: teamMembers = [],
    isLoading,
    // isError,
  } = useQuery({
    queryKey: ["team-members"],
    queryFn: async () => {
      const response = await getUserTeamMembers();
      return response.teamMembers;
    }
  });

  console.log("Team Members:", teamMembers);

  if (isLoading) {
    return <TableSkl />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Personal</CardTitle>
              <CardDescription>Gestiona tus personal</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <AddTeamMemberBtn />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar productos por nombre, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="electronics">Electrónicos</SelectItem>
                <SelectItem value="smartphones">Smartphones</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="out_of_stock">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div> */}

          <TeamMemberTable teamMembers={teamMembers} />
        </CardContent>
      </Card>
    </div>
  );
};
