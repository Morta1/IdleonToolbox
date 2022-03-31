import styled from 'styled-components'
import MailIcon from "@material-ui/icons/Mail";
import Badge from "@material-ui/core/Badge";

const Notifications = () => {
  return (
    <NotificationsStyle>
      <Badge badgeContent={4} color="primary">
        <MailIcon/>
      </Badge>
    </NotificationsStyle>
  );
};

const NotificationsStyle = styled.div`
  margin: 0 10px;
`;

export default Notifications;
