import { Divider, List } from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import StoreIcon from '@mui/icons-material/Store';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LoyaltyIcon from '@mui/icons-material/Loyalty';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useAdministrator } from '../common/util/permissions';
import MenuItem from '../common/components/MenuItem';

const FinansMenu = () => {
  const location = useLocation();
  const admin = useAdministrator();
  const user = useSelector((state) => state.session.user);
  const isServis = user?.attributes?.servis === true || user?.attributes?.servis === 'true';

  return (
    <>
      <List>
        <MenuItem
          title="Genel Bakış"
          link="/finans"
          icon={<DashboardIcon />}
          selected={location.pathname === '/finans'}
        />

        {(isServis || admin) && (
          <>
            <Divider />
            <List>
              <MenuItem
                title="Atanan İşler"
                link="/finans/servis/jobs"
                icon={<PendingActionsIcon sx={{ fontSize: 30, color: 'success.dark' }} />}
                selected={location.pathname.startsWith('/finans/servis')}
              />
            </List>
            <Divider />


          </>
        )}

        <MenuItem
          title="Sipariş Geçmişim"
          link="/finans/orders"
          icon={<ReceiptLongIcon />}
          selected={location.pathname === '/finans/orders'}
        />
        {!isServis &&
          <MenuItem
            title="Yıllık Paket İşlemleri"
            link="/settings/paymentpage"
            icon={<LoyaltyIcon />}
            selected={location.pathname === '/settings/paymentpage'}
          />
        }
        {!isServis &&
          <MenuItem
            title="Taleplerim"
            link="/finans/requests"
            icon={<AssignmentIcon />}
            selected={location.pathname === '/finans/requests'}
          />
        }
        {!isServis &&
          <MenuItem
            title="Yeni Talep"
            link="/finans/requests/new"
            icon={<BuildCircleIcon />}
            selected={location.pathname === '/finans/requests/new'}
          />
        }
      </List>



      {admin && (
        <>
          <Divider />
          <List>
            <MenuItem
              title="Tüm Talepler"
              link="/finans/admin/requests"
              icon={<AssignmentIcon />}
              selected={location.pathname === '/finans/admin/requests'}
            />
            <MenuItem
              title="Onay Kuyruğu"
              link="/finans/admin/review"
              icon={<WarningAmberIcon />}
              selected={location.pathname === '/finans/admin/review'}
            />
            <MenuItem
              title="Servis Merkezleri"
              link="/finans/admin/centers"
              icon={<StoreIcon />}
              selected={location.pathname.startsWith('/finans/admin/center')}
            />
          </List>
        </>
      )}
    </>
  );
};

export default FinansMenu;
