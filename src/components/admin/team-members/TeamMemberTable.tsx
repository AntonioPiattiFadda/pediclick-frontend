import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUserStoresContext } from "@/contexts/UserStoresContext";
import type { UserProfile } from "@/types";
import { DeleteTableElement } from "./DeleteTeamMemberBtn";
import { EditTeamMemberBtn } from "./EditTeamMemberBtn";
import { ROLES } from "./RoleInfoPopover";
import { deleteTeamMember } from "@/service/profiles";

interface TeamMemberTableProps {
  teamMembers: UserProfile[];
}

export const TeamMemberTable = ({ teamMembers }: TeamMemberTableProps) => {
  const { userStores } = useUserStoresContext();

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>

            <TableHead>Rol</TableHead>
            <TableHead>Punto de venta</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <TableRow key={member.id}>
                {/* <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        className="object-cover"
                        src={
                          member.avatar_url
                            ? member.avatar_url
                            : "/default-avatar.png"
                        }
                        alt={member.full_name}
                      />
                      <AvatarFallback>
                        {member.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                     <p className="font-medium">{member.name}</p> 
                      <p className="text-sm text-muted-foreground">
                         {member.sku} 
                      </p>
                    </div>
                  </div>
                </TableCell> */}
                <TableCell>{member.full_name}</TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell>
                  {ROLES.find((role) => role.value === member.role)?.label}
                </TableCell>
                <TableCell>
                  {userStores.find(
                    (store) => store.store_id === member.store_id
                  )?.store_name}
                </TableCell>
                <TableCell className="text-right">
                  {" "}
                  <EditTeamMemberBtn id={member.id} />{" "}
                  <DeleteTableElement
                    id={member.id}
                    endpoint={async (id: string | number) => { await deleteTeamMember(String(id)); }}
                    queryKey={["team-members"]}
                    />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No hay miembros en el equipo.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
