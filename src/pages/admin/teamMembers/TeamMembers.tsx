import { TeamMemberContainer } from "./components/TeamMemberContainer";

const TeamMembers = () => {
  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Gestión de tu personal
        </h1>
        <p className="text-muted-foreground">Administra tu personal</p>
      </div>
      <TeamMemberContainer />
    </div>
  );
};

export default TeamMembers;
