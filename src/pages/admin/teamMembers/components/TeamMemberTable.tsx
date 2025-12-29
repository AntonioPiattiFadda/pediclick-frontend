import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EditTeamMemberBtn } from "./EditTeamMemberBtn";
import { ROLES } from "./RoleInfoPopover";
import { deleteTeamMember } from "@/service/profiles";
import type { UserProfile } from "@/types/users";
import { DeleteTableElementPopUp } from "@/components/admin/deleteTableElementPopUp";

interface TeamMemberTableProps {
  teamMembers: UserProfile[];
}

export const TeamMemberTable = ({ teamMembers }: TeamMemberTableProps) => {

  return (
    <div className="rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Acciones</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>

            <TableHead>Rol</TableHead>
            {/* <TableHead>Punto de venta</TableHead> */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {teamMembers.length > 0 ? (
            teamMembers.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  {" "}
                  <EditTeamMemberBtn id={member.id} />{" "}
                  <DeleteTableElementPopUp
                    elementId={member.id}
                    elementName={member.full_name}
                    deleteFn={async (id: string | number) => {
                      await deleteTeamMember(String(id));
                    }}
                    queryKey={["team-members"]}
                    successMsgTitle="Miembro eliminado"
                    successMsgDescription="El miembro de equipo ha sido eliminado correctamente."
                    errorMsgTitle="Error al eliminar miembro"
                    errorMsgDescription="No se pudo eliminar el miembro de equipo."
                  />
                </TableCell>
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
